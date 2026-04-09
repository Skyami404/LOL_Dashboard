'use client'

import { useEffect, useState } from 'react'
import { champIconUrl } from '../lib/champIcon'
import { useDDragonVersion } from '../lib/useDDragonVersion'

interface PlayerStatsData {
  playerName: string
  gamesPlayed: number
  wins: number
  losses: number
  winRate: number
  avgKills: number
  avgDeaths: number
  avgAssists: number
  kda: number
  avgCS: number
  avgDPM: number
  topChampions: Array<{ champion: string; games: number; wins: number }>
  leagues: string[]
}

function StatBox({
  label,
  value,
  highlight,
}: {
  label: string
  value: string | number
  highlight?: boolean
}) {
  return (
    <div className="rounded-lg bg-gray-800/50 p-3 text-center">
      <div className={`text-lg font-bold ${highlight ? 'text-green-400' : 'text-white'}`}>
        {value}
      </div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  )
}

export default function PlayerStats({ playerName }: { playerName: string }) {
  const [stats, setStats] = useState<PlayerStatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const version = useDDragonVersion()

  useEffect(() => {
    setLoading(true)
    setNotFound(false)
    fetch(`/api/oracle/player/${encodeURIComponent(playerName)}`)
      .then(async (r) => {
        if (r.status === 404) {
          setNotFound(true)
          return null
        }
        if (!r.ok) throw new Error('Failed to load')
        return r.json() as Promise<PlayerStatsData>
      })
      .then((data) => { if (data) setStats(data) })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [playerName])

  if (loading) {
    return <div className="h-40 animate-pulse rounded-xl bg-gray-800/60" />
  }

  if (notFound || !stats) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 text-sm text-gray-500">
        No 2026 season data available.
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
          2026 Season Stats
        </h2>
        {stats.leagues.length > 0 && (
          <div className="flex gap-1">
            {stats.leagues.map((l) => (
              <span
                key={l}
                className="rounded bg-gray-800 px-2 py-0.5 text-[11px] font-medium text-gray-300"
              >
                {l}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Overview grid */}
      <div className="mb-4 grid grid-cols-3 gap-2">
        <StatBox label="Games" value={stats.gamesPlayed} />
        <StatBox
          label="Win Rate"
          value={`${stats.winRate.toFixed(1)}%`}
          highlight={stats.winRate >= 50}
        />
        <StatBox label="KDA" value={stats.kda.toFixed(2)} />
        <StatBox label="Avg K" value={stats.avgKills.toFixed(1)} />
        <StatBox label="Avg D" value={stats.avgDeaths.toFixed(1)} />
        <StatBox label="Avg A" value={stats.avgAssists.toFixed(1)} />
        <StatBox label="Avg CS" value={stats.avgCS.toFixed(0)} />
        <StatBox label="Avg DPM" value={stats.avgDPM.toFixed(0)} />
        <StatBox label="W / L" value={`${stats.wins} / ${stats.losses}`} />
      </div>

      {/* Top champions */}
      {stats.topChampions.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Most Played
          </p>
          <div className="space-y-2">
            {stats.topChampions.map(({ champion, games, wins }) => {
              const wr = Math.round((wins / games) * 100)
              return (
                <div key={champion} className="flex items-center gap-3 rounded-lg bg-gray-800/40 px-3 py-2">
                  <img
                    src={champIconUrl(champion, version)}
                    alt={champion}
                    className="h-7 w-7 rounded-full border border-gray-700 object-cover bg-gray-800"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                  <span className="flex-1 text-sm font-medium text-white">{champion}</span>
                  <span className="text-xs text-gray-400">{games}G</span>
                  <span className={`w-10 text-right text-xs font-semibold ${wr >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                    {wr}%
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
