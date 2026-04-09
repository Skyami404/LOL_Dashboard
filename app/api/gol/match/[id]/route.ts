import { NextRequest } from 'next/server'
import * as cheerio from 'cheerio'

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Referer': 'https://gol.gg/esports/',
}

interface PlayerStat {
  team: 'blue' | 'red'
  name: string
  champion: string
  kills: string
  deaths: string
  assists: string
  cs: string
  gold: string
  damage: string
}

interface SeriesGame {
  id: string
  label: string      // "Game 1", "Game 2" …
  blueWon: boolean | null
}

interface MatchData {
  blueTeam: string
  redTeam: string
  blueWon: boolean
  duration: string
  patch: string
  date: string
  seriesBlueWins: number   // cumulative blue wins in the series (including this game)
  seriesRedWins: number
  bans: { blue: string[]; red: string[] }
  players: PlayerStat[]
  seriesGames: SeriesGame[]
  currentGameNumber: number
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, { headers: FETCH_HEADERS, next: { revalidate: 300 } })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.text()
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id
  const base = `https://gol.gg/game/stats/${id}`

  // Fetch fullstats (player stats + champion imgs) and summary (series score) in parallel
  const [fullHtml, summaryHtml] = await Promise.all([
    fetchHtml(`${base}/page-fullstats/`).catch(() => ''),
    fetchHtml(`${base}/page-summary/`).catch(() => ''),
  ])

  const data = buildMatchData(id, fullHtml, summaryHtml)
  return Response.json(data)
}

// ─── Parse page-fullstats ───────────────────────────────────────────────────

function parseFullstats(html: string): {
  players: PlayerStat[]
  champions: string[]
  seriesNavGames: Array<{ id: string; label: string }>
  blueTeam: string
  redTeam: string
  duration: string
  patch: string
  date: string
} {
  const $ = cheerio.load(html)

  // ── Team names from title (fallback only — summary overrides these) ─────────
  const title = $('title').text().trim()
  // Strip "game N stats/…" suffix before the dash so we get a clean team name
  const vsIdx = title.indexOf(' vs ')
  let blueTeam = 'Blue Side'
  let redTeam  = 'Red Side'
  if (vsIdx !== -1) {
    blueTeam = title.slice(0, vsIdx).trim()
    const afterVs = title.slice(vsIdx + 4)
    // Red team ends at " game " or " - "
    const endIdx = afterVs.search(/\s+game\s+\d+|\s+[-–|]/)
    redTeam = (endIdx !== -1 ? afterVs.slice(0, endIdx) : afterVs.split(/[-–|]/)[0]).trim()
  }

  // ── Duration, patch, date ──────────────────────────────────────────────────
  let duration = 'N/A'
  let patch = 'N/A'
  let date  = 'N/A'
  $('h1').each((_, el) => {
    const t = $(el).text().trim()
    if (/^\d{1,2}:\d{2}$/.test(t)) duration = t
  })
  $('p, span, div').each((_, el) => {
    const t = $(el).clone().children().remove().end().text().trim()
    if (patch === 'N/A' && /^Patch\s+\d+\.\d+/.test(t)) patch = t.slice(0, 12)
    if (date === 'N/A') { const dm = t.match(/(\d{4}-\d{2}-\d{2})/); if (dm) date = dm[1] }
  })

  // ── Series nav links ────────────────────────────────────────────────────────
  const seriesNavGames: Array<{ id: string; label: string }> = []
  const seenIds = new Set<string>()
  $('a.nav-link, .game-menu-button a').each((_, el) => {
    const href  = $(el).attr('href') ?? ''
    const label = $(el).text().trim()
    const m = href.match(/game\/stats\/(\d+)\/page-game/)
    if (!m) return
    const gid = m[1]
    if (seenIds.has(gid) || !label.toLowerCase().includes('game')) return
    seenIds.add(gid)
    seriesNavGames.push({ id: gid, label })
  })

  // ── Champion imgs (in order: blue TOP→SUP, red TOP→SUP) ────────────────────
  // On page-fullstats, champion icons appear before social media images
  // Filter out known non-champion alt texts
  const skipAlts = new Set([
    'Tracker Games of Legends', 'Become a Patron', 'Instagram Games of Legends',
    'Patreon Games of Legends', 'Bluesky Games of Legends', 'Facebook Games of Legends',
    'X Bynjee', 'Runes', '', 'X',
  ])
  const champions: string[] = []
  $('img').each((_, el) => {
    const alt = $(el).attr('alt') ?? ''
    if (!skipAlts.has(alt) && champions.length < 10) {
      champions.push(alt)
    }
  })

  // ── Transposed stats table ─────────────────────────────────────────────────
  // Structure: col 0 = stat label, cols 1-5 = blue, cols 6-10 = red
  const statMap: Record<string, string[]> = {}
  $('table').first().find('tr').each((_, row) => {
    const cells = $(row).find('td')
    if (cells.length < 2) return
    const label = cells.eq(0).text().trim()
    const vals = cells.map((_, c) => $(c).text().trim()).get().slice(1)
    if (label) statMap[label] = vals
  })

  const names   = statMap['Player']  ?? []
  const kills   = statMap['Kills']   ?? []
  const deaths  = statMap['Deaths']  ?? []
  const assists = statMap['Assists'] ?? []
  const cs      = statMap['CS']      ?? []
  const golds   = statMap['Golds']   ?? []
  const damage  = statMap['Total damage to Champion'] ?? []

  const players: PlayerStat[] = []
  for (let i = 0; i < 10; i++) {
    const team: 'blue' | 'red' = i < 5 ? 'blue' : 'red'
    players.push({
      team,
      name:    names[i]   ?? '',
      champion: champions[i] ?? '',
      kills:   kills[i]   ?? '',
      deaths:  deaths[i]  ?? '',
      assists: assists[i] ?? '',
      cs:      cs[i]      ?? '',
      gold:    golds[i]   ?? '',
      damage:  damage[i]  ?? '',
    })
  }

  return { players, champions, seriesNavGames, blueTeam, redTeam, duration, patch, date }
}

// ─── Parse page-summary ────────────────────────────────────────────────────

function parseSummary(html: string, currentId: string): {
  seriesGames: SeriesGame[]
  blueWins: number
  redWins: number
  currentBlueWon: boolean | null
  currentGameNumber: number
  blueTeamName: string
  redTeamName: string
} {
  const $ = cheerio.load(html)

  // H1 elements on summary page follow this pattern:
  //   "X vs Y"  →  <blue team name>  →  BO3|BO5  →  <red team name>  →  WIN/LOSS …
  const h1Texts = $('h1').map((_, el) => $(el).text().trim()).get()

  // Series nav from summary page
  const navGames: Array<{ id: string; label: string }> = []
  const seenIds = new Set<string>()
  $('a.nav-link, .game-menu-button a').each((_, el) => {
    const href  = $(el).attr('href') ?? ''
    const label = $(el).text().trim()
    const m = href.match(/game\/stats\/(\d+)\/page-game/)
    if (!m) return
    const gid = m[1]
    if (seenIds.has(gid) || !label.toLowerCase().includes('game')) return
    seenIds.add(gid)
    navGames.push({ id: gid, label })
  })

  const formats = ['BO1','BO2','BO3','BO5','BO7']

  // ── Extract blue/red team names from H1 structure ──────────────────────────
  // Pattern: "X vs Y", <blue>, BO3|BO5, <red>, WIN/LOSS, duration, WIN/LOSS …
  let blueTeamName = ''
  let redTeamName  = ''
  const seriesTitleIdx = h1Texts.findIndex((h) => h.includes(' vs '))
  if (seriesTitleIdx !== -1) {
    let nameCount = 0
    for (let i = seriesTitleIdx + 1; i < h1Texts.length; i++) {
      const h = h1Texts[i]
      if (formats.includes(h)) continue
      if (h === 'WIN' || h === 'LOSS' || /^\d+:\d+$/.test(h)) break
      if (nameCount === 0) blueTeamName = h
      else { redTeamName = h; break }
      nameCount++
    }
  }

  // ── Parse WIN/LOSS result triples ──────────────────────────────────────────
  const resultH1s: string[] = []
  let pastHeader = false

  for (const t of h1Texts) {
    if (formats.includes(t)) { pastHeader = true; continue }
    if (pastHeader && (t === 'WIN' || t === 'LOSS' || /^\d+:\d+$/.test(t))) {
      resultH1s.push(t)
    }
  }

  // Group into triples: [blueResult, duration, redResult]
  const gameResults: Array<{ blueWon: boolean; duration: string }> = []
  for (let i = 0; i + 2 < resultH1s.length; i += 3) {
    const blueResult = resultH1s[i]
    const dur        = resultH1s[i + 1] ?? ''
    if (!/^\d+:\d+$/.test(dur)) { i -= 2; continue } // re-align if out of sync
    gameResults.push({ blueWon: blueResult === 'WIN', duration: dur })
  }

  // Build seriesGames combining nav order with results
  const seriesGames: SeriesGame[] = navGames.map((g, idx) => ({
    id: g.id,
    label: g.label,
    blueWon: gameResults[idx]?.blueWon ?? null,
  }))

  // Find current game index
  const currentIdx = navGames.findIndex((g) => g.id === currentId)
  const currentGameNumber = currentIdx + 1

  // Cumulative score up to and including current game
  let blueWins = 0
  let redWins  = 0
  const upTo = currentIdx >= 0 ? currentIdx + 1 : gameResults.length
  for (let i = 0; i < upTo && i < gameResults.length; i++) {
    if (gameResults[i].blueWon) blueWins++
    else redWins++
  }

  const currentBlueWon = currentIdx >= 0 ? (gameResults[currentIdx]?.blueWon ?? null) : null

  return { seriesGames, blueWins, redWins, currentBlueWon, currentGameNumber, blueTeamName, redTeamName }
}

// ─── Combine ───────────────────────────────────────────────────────────────

function buildMatchData(currentId: string, fullHtml: string, summaryHtml: string): MatchData {
  const full    = parseFullstats(fullHtml)
  const summary = parseSummary(summaryHtml, currentId)

  // Merge series games: prefer summary (has win data), fall back to nav from fullstats
  const seriesGames: SeriesGame[] = summary.seriesGames.length
    ? summary.seriesGames
    : full.seriesNavGames.map((g) => ({ ...g, blueWon: null }))

  // Ensure current ID is always present
  if (!seriesGames.find((g) => g.id === currentId)) {
    seriesGames.unshift({ id: currentId, label: 'Game 1', blueWon: null })
  }

  const blueWon = summary.currentBlueWon ?? false

  // Prefer summary team names (correctly identify blue/red sides).
  // Fall back to title-extracted names if summary didn't parse them.
  const blueTeam = summary.blueTeamName || full.blueTeam
  const redTeam  = summary.redTeamName  || full.redTeam

  return {
    blueTeam,
    redTeam,
    blueWon,
    duration:          full.duration,
    patch:             full.patch,
    date:              full.date,
    seriesBlueWins:    summary.blueWins,
    seriesRedWins:     summary.redWins,
    bans:              { blue: [], red: [] },
    players:           full.players,
    seriesGames,
    currentGameNumber: summary.currentGameNumber || 1,
  }
}
