import Papa from 'papaparse'

const DEFAULT_CSV_URL =
  'https://oracleselixir-downloadable-match-data.s3.amazonaws.com/2026_LoL_esports_matches.csv'

export type OracleRow = Record<string, string>

export async function fetchOracleRows(): Promise<OracleRow[]> {
  const url = process.env.ORACLE_ELIXIR_CSV_URL ?? DEFAULT_CSV_URL
  const res = await fetch(url, { next: { revalidate: 3600 } })
  if (!res.ok) throw new Error(`Failed to fetch Oracle Elixir CSV: ${res.status}`)
  const text = await res.text()
  const { data } = Papa.parse<OracleRow>(text, { header: true, skipEmptyLines: true })
  return data
}

function num(v: string | undefined): number {
  const n = parseFloat(v ?? '')
  return isNaN(n) ? 0 : n
}

export function aggregatePlayerStats(rows: OracleRow[], playerName: string) {
  const normalized = playerName.toLowerCase().replace(/_/g, ' ').trim()

  const playerRows = rows.filter(
    (r) =>
      r.position !== 'team' &&
      r.playername != null &&
      r.playername.toLowerCase().trim() === normalized
  )

  if (playerRows.length === 0) return null

  const gamesPlayed = playerRows.length
  const wins = playerRows.filter((r) => r.result === '1').length

  const totalKills = playerRows.reduce((s, r) => s + num(r.kills), 0)
  const totalDeaths = playerRows.reduce((s, r) => s + num(r.deaths), 0)
  const totalAssists = playerRows.reduce((s, r) => s + num(r.assists), 0)

  // Oracle Elixir uses "total cs" (with space) as the column name
  const totalCS = playerRows.reduce((s, r) => s + num(r['total cs']), 0)
  const totalDPM = playerRows.reduce((s, r) => s + num(r.dpm), 0)

  // Champion frequency
  const champMap = new Map<string, { games: number; wins: number }>()
  for (const row of playerRows) {
    if (!row.champion) continue
    const entry = champMap.get(row.champion) ?? { games: 0, wins: 0 }
    entry.games++
    if (row.result === '1') entry.wins++
    champMap.set(row.champion, entry)
  }
  const topChampions = Array.from(champMap.entries())
    .map(([champion, stats]) => ({ champion, ...stats }))
    .sort((a, b) => b.games - a.games)
    .slice(0, 5)

  const leagues = Array.from(new Set(playerRows.map((r) => r.league).filter(Boolean)))

  return {
    playerName,
    gamesPlayed,
    wins,
    losses: gamesPlayed - wins,
    winRate: (wins / gamesPlayed) * 100,
    avgKills: totalKills / gamesPlayed,
    avgDeaths: totalDeaths / gamesPlayed,
    avgAssists: totalAssists / gamesPlayed,
    kda: totalDeaths > 0 ? (totalKills + totalAssists) / totalDeaths : totalKills + totalAssists,
    avgCS: totalCS / gamesPlayed,
    avgDPM: totalDPM / gamesPlayed,
    topChampions,
    leagues,
  }
}

export function aggregateTeamStats(rows: OracleRow[], teamName: string) {
  const normalized = teamName.toLowerCase().replace(/_/g, ' ').trim()

  // Team-level rows have position === "team"
  const teamRows = rows.filter(
    (r) =>
      r.position === 'team' &&
      r.teamname != null &&
      r.teamname.toLowerCase().trim() === normalized
  )

  if (teamRows.length === 0) return null

  const gamesPlayed = teamRows.length
  const wins = teamRows.filter((r) => r.result === '1').length

  const avgGameLength =
    teamRows.reduce((s, r) => s + num(r.gamelength), 0) / gamesPlayed / 60
  const avgDragons = teamRows.reduce((s, r) => s + num(r.dragons), 0) / gamesPlayed
  const avgBarons = teamRows.reduce((s, r) => s + num(r.barons), 0) / gamesPlayed
  const avgTowers = teamRows.reduce((s, r) => s + num(r.towers), 0) / gamesPlayed

  const leagues = Array.from(new Set(teamRows.map((r) => r.league).filter(Boolean)))

  return {
    teamName,
    gamesPlayed,
    wins,
    losses: gamesPlayed - wins,
    winRate: (wins / gamesPlayed) * 100,
    avgGameLength,
    avgDragons,
    avgBarons,
    avgTowers,
    leagues,
  }
}
