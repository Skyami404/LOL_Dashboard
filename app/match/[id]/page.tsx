'use client'

import { useEffect, useState } from 'react'
import * as cheerio from 'cheerio'

interface MatchStats {
  blueTeam: string
  redTeam: string
  winner: string
  duration: string
  bans: { blue: string[], red: string[] }
  players: Array<{
    team: 'blue' | 'red'
    name: string
    champion: string
    kda: string
    cs: string
    gold: string
  }>
}

export default function MatchPage({ params }: { params: { id: string } }) {
  const [stats, setStats] = useState<MatchStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMatch = async () => {
      try {
        const url = `https://gol.gg/esports/game/stats/${params.id}/page-game/`
        const res = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Bot)' }
        })
        if (!res.ok) throw new Error('Failed to fetch match data')
        const html = await res.text()
        const parsed = parseGolMatch(html)
        setStats(parsed)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load match')
      } finally {
        setLoading(false)
      }
    }
    fetchMatch()
  }, [params.id])

  if (loading) return <div className="p-8 text-white">Loading match stats...</div>
  if (error) return <div className="p-8 text-red-300">{error}</div>
  if (!stats) return <div className="p-8 text-white">No stats available</div>

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">{stats.blueTeam} vs {stats.redTeam}</h1>
        <p className="mb-4">Winner: {stats.winner} | Duration: {stats.duration}</p>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Bans</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold">{stats.blueTeam}</h3>
              <div className="flex gap-2">{stats.bans.blue.map(b => <span key={b} className="bg-blue-600 px-2 py-1 rounded text-white">{b}</span>)}</div>
            </div>
            <div>
              <h3 className="font-semibold">{stats.redTeam}</h3>
              <div className="flex gap-2">{stats.bans.red.map(b => <span key={b} className="bg-red-600 px-2 py-1 rounded text-white">{b}</span>)}</div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Player Stats</h2>
          <table className="w-full border-collapse border border-gray-600">
            <thead>
              <tr className="bg-gray-800 border-b border-gray-600">
                <th className="border border-gray-600 p-2">Team</th>
                <th className="border border-gray-600 p-2">Player</th>
                <th className="border border-gray-600 p-2">Champion</th>
                <th className="border border-gray-600 p-2">KDA</th>
                <th className="border border-gray-600 p-2">CS</th>
                <th className="border border-gray-600 p-2">Gold</th>
              </tr>
            </thead>
            <tbody>
              {stats.players.map((p, i) => (
                <tr key={i} className={p.team === 'blue' ? 'bg-blue-900/20 hover:bg-blue-900/30' : 'bg-red-900/20 hover:bg-red-900/30'}>
                  <td className="border border-gray-600 p-2">{p.team}</td>
                  <td className="border border-gray-600 p-2">{p.name}</td>
                  <td className="border border-gray-600 p-2">{p.champion}</td>
                  <td className="border border-gray-600 p-2">{p.kda}</td>
                  <td className="border border-gray-600 p-2">{p.cs}</td>
                  <td className="border border-gray-600 p-2">{p.gold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function parseGolMatch(html: string): MatchStats {
  const $ = cheerio.load(html)

  // Extract teams from title or header
  const title = $('title').text() || ''
  const teams = title.split(' vs ') || []
  const blueTeam = teams[0] || 'Blue'
  const redTeam = teams[1] || 'Red'

  // Winner - look for winner indicator
  const winner = $('span:contains("Winner")').next().text() || blueTeam

  // Duration
  const duration = $('span:contains("Duration")').next().text() || 'Unknown'

  // Bans - assume tables with bans
  const bans: { blue: string[], red: string[] } = { blue: [], red: [] }
  $('table').each((i, table) => {
    if ($(table).find('th').text().includes('Ban')) {
      $(table).find('tr').each((j, row) => {
        if (j > 0) {
          const cells = $(row).find('td')
          if (cells.length >= 2) {
            bans.blue.push($(cells[0]).text().trim())
            bans.red.push($(cells[1]).text().trim())
          }
        }
      })
    }
  })

  // Players - main stats table
  const players: MatchStats['players'] = []
  $('table').each((i, table) => {
    if ($(table).find('th').text().includes('Player') || $(table).find('th').text().includes('Champion')) {
      $(table).find('tr').each((j, row) => {
        if (j > 0) {
          const cells = $(row).find('td')
          if (cells.length >= 6) {
            const team = j % 2 === 1 ? 'blue' : 'red' // simplistic
            players.push({
              team,
              name: $(cells[0]).text().trim(),
              champion: $(cells[1]).text().trim(),
              kda: $(cells[2]).text().trim(),
              cs: $(cells[3]).text().trim(),
              gold: $(cells[4]).text().trim(),
            })
          }
        }
      })
    }
  })

  return { blueTeam, redTeam, winner, duration, bans, players }
}