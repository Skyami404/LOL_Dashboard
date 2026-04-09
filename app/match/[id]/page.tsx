'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { champIconUrl } from '../../../lib/champIcon'
import { useDDragonVersion } from '../../../lib/useDDragonVersion'

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
  label: string
  blueWon: boolean | null
}

interface MatchData {
  blueTeam: string
  redTeam: string
  blueWon: boolean
  duration: string
  patch: string
  date: string
  seriesBlueWins: number
  seriesRedWins: number
  bans: { blue: string[]; red: string[] }
  players: PlayerStat[]
  seriesGames: SeriesGame[]
  currentGameNumber: number
}

function ChampIcon({ name, version, size = 'md' }: { name: string; version: string; size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'sm' ? 'h-6 w-6' : size === 'lg' ? 'h-12 w-12' : 'h-9 w-9'
  return (
    <img
      src={champIconUrl(name, version)}
      alt={name}
      title={name}
      className={`${sz} rounded-full border border-gray-700 object-cover bg-gray-800`}
      onError={(e) => { ;(e.target as HTMLImageElement).style.display = 'none' }}
    />
  )
}

export default function MatchPage({ params }: { params: { id: string } }) {
  const [data, setData]       = useState<MatchData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const version = useDDragonVersion()
  const router  = useRouter()

  useEffect(() => {
    setLoading(true)
    setData(null)
    setError(null)
    fetch(`/api/gol/match/${params.id}`)
      .then((r) => { if (!r.ok) throw new Error('Failed to fetch match'); return r.json() })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 p-8">
        <div className="mx-auto max-w-7xl space-y-4">
          {[32, 64, 48].map((h, i) => (
            <div key={i} className={`h-${h} animate-pulse rounded-xl bg-gray-800`} style={{ height: h * 4 }} />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 p-8 text-white">
        <div className="mx-auto max-w-7xl">
          <Link href="/" className="text-sm text-blue-400 hover:text-blue-300">Back to matches</Link>
          <div className="mt-6 rounded-xl border border-red-800 bg-red-900/20 p-6 text-red-300">{error}</div>
        </div>
      </div>
    )
  }

  if (!data) return null

  const { blueTeam, redTeam, blueWon, seriesGames, seriesBlueWins, seriesRedWins, currentGameNumber } = data
  const bluePlayers = data.players.filter((p) => p.team === 'blue')
  const redPlayers  = data.players.filter((p) => p.team === 'red')
  const hasMultiple = seriesGames.length > 1

  // Series score header label: "T1 2–1 Gen.G" or "T1 leads 2–0"
  const seriesLabel = (() => {
    const total = seriesBlueWins + seriesRedWins
    if (total === 0) return null
    if (seriesBlueWins > seriesRedWins) return `${blueTeam} leads ${seriesBlueWins}–${seriesRedWins}`
    if (seriesRedWins > seriesBlueWins) return `${redTeam} leads ${seriesRedWins}–${seriesBlueWins}`
    return `Tied ${seriesBlueWins}–${seriesRedWins}`
  })()

  return (
    <div className="min-h-screen bg-gray-950 pb-12 text-white">
      {/* ── Match header ──────────────────────────────────────────────────────── */}
      <div className="border-b border-gray-800 bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <Link href="/" className="text-sm text-gray-400 hover:text-white">Back to matches</Link>

          {/* Series game tabs */}
          {hasMultiple && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-500">Series:</span>
              {seriesGames.map((g, i) => {
                const isCurrent = g.id === params.id
                // Per-game win indicator dot
                const dot =
                  g.blueWon === null ? null :
                  g.blueWon ? (
                    <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-blue-400" title="Blue won" />
                  ) : (
                    <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-red-400" title="Red won" />
                  )
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => router.push(`/match/${g.id}`)}
                    className={`flex items-center rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
                      isCurrent
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    G{i + 1}
                    {dot}
                  </button>
                )
              })}
              {seriesLabel && (
                <span className="ml-2 text-xs font-semibold text-gray-300">{seriesLabel}</span>
              )}
            </div>
          )}

          {/* Score row */}
          <div className="mt-5 flex items-center justify-between gap-4">
            {/* Blue team */}
            <div className={`flex-1 text-left ${blueWon ? '' : 'opacity-60'}`}>
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-start">
                  <span className="text-2xl font-extrabold text-blue-300">{blueTeam}</span>
                  <span className="text-xs text-blue-500">Blue Side</span>
                </div>
                {blueWon && (
                  <span className="rounded-full bg-blue-600/30 px-2 py-0.5 text-xs font-bold text-blue-300 ring-1 ring-blue-600">WIN</span>
                )}
              </div>
            </div>

            {/* Centre: game score + meta */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-3 text-4xl font-extrabold">
                <span className={blueWon ? 'text-blue-300' : 'text-gray-600'}>{seriesBlueWins}</span>
                <span className="text-gray-600">–</span>
                <span className={!blueWon ? 'text-red-300' : 'text-gray-600'}>{seriesRedWins}</span>
              </div>
              <div className="mt-1 flex flex-wrap items-center justify-center gap-2 text-xs text-gray-500">
                {currentGameNumber > 0 && <span>Game {currentGameNumber}</span>}
                {data.duration !== 'N/A' && <span>{data.duration}</span>}
                {data.date !== 'N/A' && <span>{data.date}</span>}
                {data.patch !== 'N/A' && <span>{data.patch}</span>}
              </div>
            </div>

            {/* Red team */}
            <div className={`flex-1 text-right ${!blueWon ? '' : 'opacity-60'}`}>
              <div className="flex items-center justify-end gap-3">
                {!blueWon && (
                  <span className="rounded-full bg-red-600/30 px-2 py-0.5 text-xs font-bold text-red-300 ring-1 ring-red-600">WIN</span>
                )}
                <div className="flex flex-col items-end">
                  <span className="text-2xl font-extrabold text-red-300">{redTeam}</span>
                  <span className="text-xs text-red-500">Red Side</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Player stats ──────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl space-y-6 px-4 pt-6">
        {bluePlayers.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-blue-900/40 bg-gray-900">
            <div className={`border-b border-blue-900/40 px-5 py-3 ${blueWon ? 'bg-blue-950/40' : 'bg-gray-900'}`}>
              <span className="font-bold text-blue-300">{blueTeam}</span>
              <span className="ml-2 text-xs text-blue-500">Blue Side</span>
              {blueWon && <span className="ml-3 rounded-full bg-blue-600/30 px-2 py-0.5 text-xs font-bold text-blue-300 ring-1 ring-blue-600">WIN</span>}
            </div>
            <PlayerTable players={bluePlayers} version={version} />
          </div>
        )}

        {redPlayers.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-red-900/40 bg-gray-900">
            <div className={`border-b border-red-900/40 px-5 py-3 ${!blueWon ? 'bg-red-950/30' : 'bg-gray-900'}`}>
              <span className="font-bold text-red-300">{redTeam}</span>
              <span className="ml-2 text-xs text-red-500">Red Side</span>
              {!blueWon && <span className="ml-3 rounded-full bg-red-600/30 px-2 py-0.5 text-xs font-bold text-red-300 ring-1 ring-red-600">WIN</span>}
            </div>
            <PlayerTable players={redPlayers} version={version} />
          </div>
        )}

        {/* Fallback: combined table */}
        {bluePlayers.length === 0 && redPlayers.length === 0 && data.players.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
            <div className="border-b border-gray-800 px-5 py-3">
              <span className="font-bold text-white">Player Stats</span>
            </div>
            <PlayerTable players={data.players} version={version} />
          </div>
        )}

        {data.players.length === 0 && (
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-8 text-center text-gray-500">
            No player stats available for this match.
          </div>
        )}
      </div>
    </div>
  )
}

function PlayerTable({ players, version }: { players: PlayerStat[]; version: string }) {
  const hasGold   = players.some((p) => p.gold && p.gold !== '0')
  const hasDamage = players.some((p) => p.damage && p.damage !== '0')

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
            <th className="px-4 py-3">Player</th>
            <th className="px-4 py-3">Champion</th>
            <th className="px-4 py-3 text-center">K</th>
            <th className="px-4 py-3 text-center">D</th>
            <th className="px-4 py-3 text-center">A</th>
            <th className="px-4 py-3 text-center">CS</th>
            {hasGold   && <th className="px-4 py-3 text-center">Gold</th>}
            {hasDamage && <th className="px-4 py-3 text-center">Dmg</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/50">
          {players.map((p, i) => (
            <tr key={i} className="hover:bg-white/5">
              <td className="px-4 py-3 font-semibold text-white">
                {p.name
                  ? <Link href={`/players/${encodeURIComponent(p.name)}`} className="hover:text-blue-300">{p.name}</Link>
                  : '—'}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {p.champion && <ChampIcon name={p.champion} version={version} size="sm" />}
                  <span className="text-gray-300">{p.champion || '—'}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-center font-bold text-green-400">{p.kills  || '—'}</td>
              <td className="px-4 py-3 text-center font-bold text-red-400">{p.deaths  || '—'}</td>
              <td className="px-4 py-3 text-center font-bold text-blue-400">{p.assists || '—'}</td>
              <td className="px-4 py-3 text-center text-gray-300">{p.cs     || '—'}</td>
              {hasGold   && (
                <td className="px-4 py-3 text-center text-yellow-400">
                  {p.gold ? Number(p.gold).toLocaleString() : '—'}
                </td>
              )}
              {hasDamage && (
                <td className="px-4 py-3 text-center text-orange-300">
                  {p.damage ? Number(p.damage).toLocaleString() : '—'}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
