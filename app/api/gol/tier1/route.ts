import { NextRequest } from 'next/server'

const GOL_HEADERS = {
  'Content-Type': 'application/x-www-form-urlencoded',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'X-Requested-With': 'XMLHttpRequest',
  'Origin': 'https://gol.gg',
  'Referer': 'https://gol.gg/esports/',
}

// Tier 1 regional leagues — match tournament name starting with these (space after to avoid "LCKCUP" etc.)
const REGIONAL = ['LCK', 'LPL', 'LEC', 'LCS']

// International tournament keywords — match if the name contains any of these
const INTERNATIONAL_KEYWORDS = [
  'WORLDS', 'WORLD CHAMPIONSHIP', 'MSI', 'MID-SEASON INVITATIONAL',
  'MID SEASON INVITATIONAL', 'ALL-STAR', 'ALL STAR', 'FIRST STAND',
  'RIFT RIVALS', 'CLASH OF NATIONS',
]

function isTier1(tournament: string): boolean {
  const t = tournament.toUpperCase()
  // Regional: exact match or starts with "LCK ", "LPL ", etc.
  if (REGIONAL.some((l) => t === l || t.startsWith(l + ' '))) return true
  // International: contains a known keyword
  if (INTERNATIONAL_KEYWORDS.some((kw) => t.includes(kw))) return true
  return false
}

interface GolMatch {
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

async function fetchPage(start: number): Promise<GolMatch[]> {
  const body = new URLSearchParams({ start: String(start) })
  const res = await fetch('https://gol.gg/esports/ajax.home.php', {
    method: 'POST',
    body: body.toString(),
    headers: GOL_HEADERS,
  })
  if (!res.ok) return []
  return res.json()
}

export async function GET(req: NextRequest) {
  const league = req.nextUrl.searchParams.get('league')?.toUpperCase() ?? null

  // Scan 15 pages (150 matches) in parallel — covers ~2 weeks of play across all regions
  const offsets = Array.from({ length: 15 }, (_, i) => i * 10)

  const settled = await Promise.allSettled(offsets.map((start) => fetchPage(start)))

  const all: GolMatch[] = settled
    .filter((r): r is PromiseFulfilledResult<GolMatch[]> => r.status === 'fulfilled')
    .flatMap((r) => r.value)

  // Filter to tier 1
  let filtered = all.filter((m) => isTier1(m.tournament))

  // Optionally filter to a single league
  if (league) {
    filtered = filtered.filter((m) => {
      const t = m.tournament.toUpperCase()
      return t === league || t.startsWith(league + ' ')
    })
  }

  // Deduplicate by game_id
  const seen = new Set<string>()
  const unique = filtered.filter((m) => {
    if (seen.has(m.game_id)) return false
    seen.add(m.game_id)
    return true
  })

  // Sort newest first
  unique.sort((a, b) => b.game_date.localeCompare(a.game_date))

  return Response.json(unique, {
    headers: { 'Cache-Control': 's-maxage=120, stale-while-revalidate=60' },
  })
}
