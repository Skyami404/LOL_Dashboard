import { NextRequest } from 'next/server'
import * as cheerio from 'cheerio'

const GOL_BASE = 'https://gol.gg'
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Referer: 'https://gol.gg/esports/',
}

// Map GoL season codes to years
const SEASON_MAP: Record<string, string> = {
  S16: '2026', S15: '2025', S14: '2024', S13: '2023', S12: '2022',
  S11: '2021', S10: '2020', S9: '2019', S8: '2018', S7: '2017',
  S6: '2016',
}

async function getPlayerId(ign: string): Promise<string | null> {
  const res = await fetch(`${GOL_BASE}/esports/home/`, {
    headers: HEADERS,
    next: { revalidate: 3600 },
  })
  if (!res.ok) return null
  const html = await res.text()

  // Player list format: {class:'player',value: 'p_48',name: 'Faker - KR'}
  const normalized = ign.toLowerCase().replace(/\s+/g, '')
  const regex = /\{class:'player',value:\s*'(p_\d+)',name:\s*'([^']+)'\}/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(html)) !== null) {
    const playerName = match[2].split(' - ')[0].trim()
    if (playerName.toLowerCase().replace(/\s+/g, '') === normalized) {
      return match[1].replace('p_', '')
    }
  }
  return null
}

async function scrapePlayerStats(playerId: string, season: string, split: string) {
  const url = `${GOL_BASE}/players/player-stats/${playerId}/season-${season}/split-${split}/tournament-ALL/champion-ALL/`
  const res = await fetch(url, {
    headers: HEADERS,
    next: { revalidate: 1800 },
  })
  if (!res.ok) return null
  const html = await res.text()
  const $ = cheerio.load(html)

  // Seasons available from table 0
  const seasons: string[] = []
  $('table').eq(0).find('td, th').each((_, el) => {
    const text = $(el).text().trim()
    if (/^S\d+$/.test(text)) seasons.push(text)
  })

  // Splits available from table 1
  const splits: string[] = []
  $('table').eq(1).find('td, th').each((_, el) => {
    const text = $(el).text().trim()
    if (text && text !== 'Split:') splits.push(text)
  })

  // General stats — contained in the text around table 2
  let record = '', winRate = '', kda = '', csm = '', gpm = '', killParticipation = '', dpm = ''
  const statsText = $('table').eq(2).closest('div').parent().text().replace(/\s+/g, ' ')
  const recordMatch = statsText.match(/Record:\s*(\d+W\s*-\s*\d+L)/)
  if (recordMatch) record = recordMatch[1].replace(/\s+/g, '')
  const wrMatch = statsText.match(/Win Rate:\s*([\d.]+)%/)
  if (wrMatch) winRate = wrMatch[1]
  const kdaMatch = statsText.match(/KDA:\s*([\d.]+)/)
  if (kdaMatch) kda = kdaMatch[1]
  const csmMatch = statsText.match(/CS per Minute:\s*([\d.]+)/)
  if (csmMatch) csm = csmMatch[1]
  const gpmMatch = statsText.match(/Gold Per Minute:\s*([\d.]+)/)
  if (gpmMatch) gpm = gpmMatch[1]
  const kpMatch = statsText.match(/Kill Participation:\s*([\d.]+)%/)
  if (kpMatch) killParticipation = kpMatch[1]

  // Damage stats table
  $('table').each((_, table) => {
    const text = $(table).text().replace(/\s+/g, ' ')
    const dpmMatch = text.match(/Damage Per Minute:\s*([\d.]+)/)
    if (dpmMatch && !dpm) dpm = dpmMatch[1]
  })

  // Champion pool table — find the table with "Champion Nb games Win Rate KDA"
  const champions: Array<{ champion: string; games: number; winRate: string; kda: string }> = []
  $('table').each((_, table) => {
    const headers = $(table).find('tr').first().text().replace(/\s+/g, ' ').trim()
    if (!headers.includes('Champion') || !headers.includes('games')) return
    $(table).find('tr').each((rowIdx, row) => {
      if (rowIdx === 0) return
      const cells = $(row).find('td')
      if (cells.length < 2) return
      const champName = cells.eq(0).text().trim()
      const games = parseInt(cells.eq(1).text().trim(), 10)
      const wr = cells.eq(2).text().replace(/&nbsp;/g, '').trim()
      const champKda = cells.eq(3).text().replace(/&nbsp;/g, '').trim()
      if (champName && !isNaN(games) && games > 0) {
        champions.push({ champion: champName, games, winRate: wr, kda: champKda })
      }
    })
  })

  return {
    playerId,
    season,
    split,
    record,
    winRate,
    kda,
    csm,
    gpm,
    killParticipation,
    dpm,
    champions: champions.slice(0, 10),
    availableSeasons: seasons,
    availableSplits: splits,
  }
}

interface PlayerMatchEntry {
  gameId: string
  date: string
  tournament: string
  matchName: string
  champion: string
  result: 'Win' | 'Loss'
  duration: string
  kda: string
  csm: string
  dpm: string
  kp: string
}

async function scrapePlayerMatches(playerId: string, season: string): Promise<PlayerMatchEntry[]> {
  const url = `${GOL_BASE}/players/player-matchlist/${playerId}/season-${season}/split-ALL/tournament-ALL/`
  const res = await fetch(url, { headers: HEADERS, next: { revalidate: 300 } })
  if (!res.ok) return []
  const html = await res.text()
  const $ = cheerio.load(html)

  const entries: PlayerMatchEntry[] = []

  // Table columns (0-indexed):
  // 0: Champion  1: Result  2: Duration  3: KDA  4: CSM  5: DPM  6: KP%
  // 7: Build  8: Date  9: Game (link = game ID, text = "TeamA vs TeamB")  10: Tournament
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let targetTable: any = null
  $('table').each((_, table) => {
    const headerText = $(table).find('tr').first().text()
    if (headerText.includes('Champion') && headerText.includes('Result') && headerText.includes('Game')) {
      targetTable = $(table)
      return false
    }
  })

  if (!targetTable) return []

  $(targetTable).find('tbody tr').each((_, row) => {
    const cells = $(row).find('td')
    if (cells.length < 9) return

    // Champion name from img alt
    const champion = cells.eq(0).find('img').first().attr('alt')?.trim() ?? cells.eq(0).text().trim()
    if (!champion) return

    // Result: GoL uses "Victory" or "Defeat"
    const resultText = cells.eq(1).text().trim().toLowerCase()
    const result: 'Win' | 'Loss' = resultText.includes('victory') ? 'Win' : 'Loss'

    const duration   = cells.eq(2).text().trim()
    const kda        = cells.eq(3).text().trim()
    const csm        = cells.eq(4).text().trim()
    const dpm        = cells.eq(5).text().trim()
    const kp         = cells.eq(6).text().trim().replace('%', '')
    const date       = cells.eq(8).text().trim()

    // Game column: link href has game ID, link text has "TeamA vs TeamB"
    const gameAnchor = cells.eq(9).find('a').first()
    const matchName  = gameAnchor.text().trim()
    const gameHref   = gameAnchor.attr('href') ?? ''
    const gameIdMatch = gameHref.match(/game\/stats\/(\d+)\//)
    const gameId     = gameIdMatch?.[1] ?? ''

    // Tournament
    const tournament = cells.eq(10).find('a').first().text().trim() || cells.eq(10).text().trim()

    if (champion && matchName) {
      entries.push({ gameId, date, tournament, matchName, champion, result, duration, kda, csm, dpm, kp })
    }
  })

  return entries
}

export async function GET(req: NextRequest, { params }: { params: { name: string } }) {
  const ign = decodeURIComponent(params.name)
  const season = req.nextUrl.searchParams.get('season') ?? 'S16'
  const split = req.nextUrl.searchParams.get('split') ?? 'ALL'
  const wantMatches = req.nextUrl.searchParams.get('matches') === 'true'

  try {
    const playerId = await getPlayerId(ign)
    if (!playerId) {
      return Response.json({ error: 'Player not found on GoL' }, { status: 404 })
    }

    if (wantMatches) {
      const matches = await scrapePlayerMatches(playerId, season)
      return Response.json({ matches, season, year: SEASON_MAP[season] ?? season })
    }

    const stats = await scrapePlayerStats(playerId, season, split)
    if (!stats) {
      return Response.json({ error: 'Failed to fetch player stats' }, { status: 502 })
    }

    return Response.json({ ...stats, year: SEASON_MAP[season] ?? season })
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    )
  }
}
