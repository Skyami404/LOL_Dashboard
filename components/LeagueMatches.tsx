'use client'

import Link from 'next/link'
import useSWR from 'swr'
import { champIconUrl } from '../lib/champIcon'
import { useDDragonVersion } from '../lib/useDDragonVersion'

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

function parseGameName(name: string) {
  const m = name.match(/^(.+?)\s+vs\s+(.+?)\s+(G\d+)$/i)
  if (m) return { blue: m[1], red: m[2], game: m[3] }
  const m2 = name.match(/^(.+?)\s+vs\s+(.+)$/)
  if (m2) return { blue: m2[1], red: m2[2], game: '' }
  return { blue: name, red: '', game: '' }
}

function ChampIcon({ name, version }: { name: string; version: string }) {
  const url = champIconUrl(name, version)
  if (!url) return null
  return (
    <img
      src={url}
      alt={name}
      title={name}
      className="h-7 w-7 rounded-full border border-gray-700 object-cover bg-gray-800"
      onError={(e) => { ;(e.target as HTMLImageElement).style.display = 'none' }}
    />
  )
}

async function fetchLeague(league: string): Promise<GolMatch[]> {
  const res = await fetch(`/api/gol/tier1?league=${encodeURIComponent(league)}`)
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

export default function LeagueMatches({ tournament }: { tournament: string }) {
  const slug = tournament.toUpperCase()
  const version = useDDragonVersion()

  const { data: matches, error, isLoading, isValidating } = useSWR(
    ['league-tier1', slug],
    ([, s]) => fetchLeague(s),
    { refreshInterval: 120_000, keepPreviousData: true, dedupingInterval: 60_000 }
  )

  const showSkeleton = isLoading && !matches

  return (
    <div>
      {/* Header bar */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${isValidating ? 'animate-pulse bg-green-400' : 'bg-green-600'}`} />
            <span className="text-xs font-medium text-green-500">LIVE</span>
          </div>
          <span className="text-xs text-gray-600">|</span>
          <span className="text-xs text-gray-500">Most recent {slug} matches</span>
        </div>
      </div>

      {showSkeleton && (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-800/60" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-900/20 p-4 text-sm text-red-300">
          {error.message ?? 'Failed to load matches'}
        </div>
      )}

      {!showSkeleton && !error && matches && matches.length === 0 && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-8 text-center text-gray-500">
          <p className="font-medium">No recent {slug} matches found.</p>
          <p className="mt-1 text-sm">The feed scans the 150 most recent global matches. Try again later.</p>
        </div>
      )}

      {!showSkeleton && matches && matches.length > 0 && (
        <div className={`overflow-hidden rounded-xl border border-gray-800 transition-opacity ${isValidating ? 'opacity-75' : ''}`}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3">Tournament</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Match</th>
                <th className="px-4 py-3 text-blue-400">Blue</th>
                <th className="px-4 py-3 text-red-400">Red</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {matches.map((m) => {
                const parsed = parseGameName(m.game_name)
                const blue = [m.bluetop_name, m.bluejgl_name, m.bluemid_name, m.bluebot_name, m.bluesup_name]
                const red  = [m.redtop_name,  m.redjgl_name,  m.redmid_name,  m.redbot_name,  m.redsup_name]
                return (
                  <tr key={m.game_id} className="bg-gray-900/40 transition-colors hover:bg-gray-800/60">
                    <td className="px-4 py-3 text-xs text-gray-500">{m.tournament}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">{m.game_date}</td>
                    <td className="px-4 py-3">
                      <Link href={`/match/${m.game_id}`} className="font-semibold text-white hover:text-blue-300">
                        {parsed.blue}{parsed.red ? ` vs ${parsed.red}` : ''}
                      </Link>
                      {parsed.game && (
                        <span className="ml-1.5 rounded bg-gray-800 px-1.5 py-0.5 text-[11px] text-gray-400">
                          {parsed.game}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {blue.map((n, i) => n ? <ChampIcon key={i} name={n} version={version} /> : null)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {red.map((n, i) => n ? <ChampIcon key={i} name={n} version={version} /> : null)}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
