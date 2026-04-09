import { NextRequest } from 'next/server'
import * as cheerio from 'cheerio'

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Referer': 'https://gol.gg/esports/',
}

interface LeagueMatch {
  game_id: string
  game_date: string
  game_name: string
  tournament: string
  bluetop_name: string
  bluejgl_name: string
  bluemid_name: string
  bluebot_name: string
  bluesup_name: string
  redtop_name: string
  redjgl_name: string
  redmid_name: string
  redbot_name: string
  redsup_name: string
}

async function getTournamentName(slug: string): Promise<string | null> {
  const res = await fetch('https://gol.gg/tournament/tournament-list/', {
    headers: HEADERS,
    next: { revalidate: 3600 },
  })
  if (!res.ok) return null
  const html = await res.text()
  const $ = cheerio.load(html)

  const upper = slug.toUpperCase()
  let found: string | null = null

  // Tournament list table has rows with tournament name links
  $('table tr').each((_, row) => {
    if (found) return
    const link = $(row).find('a')
    const name = link.text().trim()
    // Match if name starts with the slug (e.g. "LCK 2026 Winter")
    if (name.toUpperCase().startsWith(upper + ' ') || name.toUpperCase() === upper) {
      found = name
    }
  })

  return found
}

async function getTournamentMatchlist(tournament: string): Promise<LeagueMatch[]> {
  const encoded = encodeURIComponent(tournament)
  const url = `https://gol.gg/tournament/tournament-matchlist/${encoded}/`
  const res = await fetch(url, {
    headers: HEADERS,
    next: { revalidate: 300 },
  })
  if (!res.ok) return []
  const html = await res.text()
  const $ = cheerio.load(html)

  const matches: LeagueMatch[] = []

  $('table tr').each((rowIdx, row) => {
    if (rowIdx === 0) return // skip header

    const cells = $(row).find('td')
    if (cells.length < 3) return

    // Typical columns: Date | Blue Team | Score | Red Team | Match link
    const link = $(row).find('a[href*="/game/stats/"]')
    const href = link.attr('href') ?? ''
    const idMatch = href.match(/\/game\/stats\/(\d+)\//)
    if (!idMatch) return

    const gameId = idMatch[1]
    const date = cells.eq(0).text().trim()

    // Game name from the link text or build from team names
    const gameName = link.text().trim() || cells.eq(1).text().trim()

    // Blue picks from champion icons in the row
    const champImgs = $(row).find('img[alt]')
    const champs = champImgs.map((_, img) => $(img).attr('alt') ?? '').get()

    matches.push({
      game_id: gameId,
      game_date: date,
      game_name: gameName,
      tournament,
      bluetop_name: champs[0] ?? '',
      bluejgl_name: champs[1] ?? '',
      bluemid_name: champs[2] ?? '',
      bluebot_name: champs[3] ?? '',
      bluesup_name: champs[4] ?? '',
      redtop_name: champs[5] ?? '',
      redjgl_name: champs[6] ?? '',
      redmid_name: champs[7] ?? '',
      redbot_name: champs[8] ?? '',
      redsup_name: champs[9] ?? '',
    })
  })

  return matches
}

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const slug = decodeURIComponent(params.slug).toUpperCase()

  try {
    // Try to find the most recent tournament for this league
    const tournament = await getTournamentName(slug)
    if (!tournament) {
      return Response.json(
        { error: `No tournament found for ${slug}`, matches: [] },
        { status: 200 }
      )
    }

    const matches = await getTournamentMatchlist(tournament)
    return Response.json({ tournament, matches })
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Failed', matches: [] },
      { status: 200 }
    )
  }
}
