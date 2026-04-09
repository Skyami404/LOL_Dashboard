'use client'

import { useEffect, useState } from 'react'

interface TeamStatsData {
  teamName: string
  gamesPlayed: number
  wins: number
  losses: number
  winRate: number
  avgGameLength: number
  avgDragons: number
  avgBarons: number
  avgTowers: number
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

export default function TeamStats({ teamName }: { teamName: string }) {
  const [stats, setStats] = useState<TeamStatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    setLoading(true)
    setNotFound(false)
    fetch(`/api/oracle/team/${encodeURIComponent(teamName)}`)
      .then(async (r) => {
        if (r.status === 404) {
          setNotFound(true)
          return null
        }
        if (!r.ok) throw new Error('Failed to load')
        return r.json() as Promise<TeamStatsData>
      })
      .then((data) => { if (data) setStats(data) })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [teamName])

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

      <div className="mb-3 grid grid-cols-2 gap-2">
        <StatBox label="Games" value={stats.gamesPlayed} />
        <StatBox
          label="Win Rate"
          value={`${stats.winRate.toFixed(1)}%`}
          highlight={stats.winRate >= 50}
        />
        <StatBox label="Wins" value={stats.wins} />
        <StatBox label="Losses" value={stats.losses} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <StatBox label="Avg Game" value={`${stats.avgGameLength.toFixed(0)}m`} />
        <StatBox label="Avg Towers" value={stats.avgTowers.toFixed(1)} />
        <StatBox label="Avg Dragons" value={stats.avgDragons.toFixed(1)} />
        <StatBox label="Avg Barons" value={stats.avgBarons.toFixed(1)} />
      </div>
    </div>
  )
}
