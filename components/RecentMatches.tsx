'use client'

import { useEffect, useMemo, useState } from 'react'

interface GolMatch {
  game_id: string
  game_date: string
  game_name: string
  tournament: string
  bluetop_id: string
  bluetop_name: string
  bluejgl_id: string
  bluejgl_name: string
  bluemid_id: string
  bluemid_name: string
  bluebot_id: string
  bluebot_name: string
  bluesup_id: string
  bluesup_name: string
  redtop_id: string
  redtop_name: string
  redjgl_id: string
  redjgl_name: string
  redmid_id: string
  redmid_name: string
  redbot_id: string
  redbot_name: string
  redsup_id: string
  redsup_name: string
}

const GOL_HOME_JSON = 'https://gol.gg/esports/ajax.home.php'
const CHAMP_ICON_BASE = 'https://gol.gg/esports/_img/champions_icon'

function buildMatchLink(id: string) {
  return `/match/${id}`
}

function buildTournamentLink(tournament: string) {
  return `/league/${encodeURIComponent(tournament)}`
}

function champIconUrl(champion: string) {
  const clean = champion.replace(/\s+/g, '')
  return `${CHAMP_ICON_BASE}/${encodeURIComponent(clean)}.png`
}

export default function RecentMatches() {
  const [matches, setMatches] = useState<GolMatch[]>([])
  const [start, setStart] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const canPrev = start > 0

  const fetchMatches = async (newStart: number) => {
    setLoading(true)
    setError(null)
    try {
      const form = new URLSearchParams({ start: String(newStart) })
      const res = await fetch(GOL_HOME_JSON, {
        method: 'POST',
        body: form,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
      if (!res.ok) throw new Error('Failed to fetch matches')
      const data = (await res.json()) as GolMatch[]
      setMatches(data)
      setStart(newStart)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load matches')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMatches(0)
  }, [])

  const table = useMemo(() => {
    if (matches.length === 0) return null

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-white border border-gray-600">
          <thead>
            <tr className="border-b border-gray-600 bg-gray-800">
              <th className="px-3 py-2 border-r border-gray-600">Tournament</th>
              <th className="px-3 py-2 border-r border-gray-600">Date</th>
              <th className="px-3 py-2 border-r border-gray-600">Game</th>
              <th className="px-3 py-2 border-r border-gray-600 hidden md:table-cell">Blue side</th>
              <th className="px-3 py-2 hidden md:table-cell">Red side</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((m) => (
              <tr key={m.game_id} className="border-b border-gray-600 hover:bg-gray-700">
                <td className="px-3 py-2 border-r border-gray-600">
                  <a
                    href={buildTournamentLink(m.tournament)}
                    className="font-semibold text-blue-400 hover:text-blue-300"
                  >
                    {m.tournament}
                  </a>
                </td>
                <td className="px-3 py-2 border-r border-gray-600 text-gray-300">{m.game_date}</td>
                <td className="px-3 py-2 border-r border-gray-600">
                  <a
                    href={buildMatchLink(m.game_id)}
                    className="font-semibold text-blue-400 hover:text-blue-300"
                  >
                    {m.game_name}
                  </a>
                </td>
                <td className="px-3 py-2 border-r border-gray-600 hidden md:table-cell">
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: m.bluetop_id, name: m.bluetop_name },
                      { id: m.bluejgl_id, name: m.bluejgl_name },
                      { id: m.bluemid_id, name: m.bluemid_name },
                      { id: m.bluebot_id, name: m.bluebot_name },
                      { id: m.bluesup_id, name: m.bluesup_name },
                    ].map((champ) => (
                      <img
                        key={champ.id}
                        className="h-7 w-7 rounded-full"
                        src={champIconUrl(champ.name)}
                        alt={champ.name}
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).src =
                            'https://gol.gg/esports/_img/champions_icon/default.png'
                        }}
                      />
                    ))}
                  </div>
                </td>
                <td className="px-3 py-2 hidden md:table-cell">
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: m.redtop_id, name: m.redtop_name },
                      { id: m.redjgl_id, name: m.redjgl_name },
                      { id: m.redmid_id, name: m.redmid_name },
                      { id: m.redbot_id, name: m.redbot_name },
                      { id: m.redsup_id, name: m.redsup_name },
                    ].map((champ) => (
                      <img
                        key={champ.id}
                        className="h-7 w-7 rounded-full"
                        src={champIconUrl(champ.name)}
                        alt={champ.name}
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).src =
                            'https://gol.gg/esports/_img/champions_icon/default.png'
                        }}
                      />
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }, [matches])

  return (
    <div className="rounded-xl bg-gray-900/60 p-6 shadow-xl">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Last games</h2>
          <p className="text-sm text-gray-300">Live results from gol.gg (updated every fetch)</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!canPrev || loading}
            onClick={() => fetchMatches(Math.max(0, start - 10))}
            className="rounded-lg bg-gray-700 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ‹ Previous 10 games
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => fetchMatches(start + 10)}
            className="rounded-lg bg-gray-700 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next 10 games ›
          </button>
        </div>
      </div>

      <div className="mt-4">
        {loading ? (
          <p className="text-sm text-gray-300">Loading matches...</p>
        ) : error ? (
          <p className="text-sm text-red-300">{error}</p>
        ) : (
          table
        )}
      </div>
    </div>
  )
}
