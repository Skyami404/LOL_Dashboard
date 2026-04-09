'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { champIconUrl } from '../lib/champIcon'
import { useDDragonVersion } from '../lib/useDDragonVersion'

// ─── Types ────────────────────────────────────────────────────────────────────

interface InfoField { key: string; value: string }

interface GolStats {
  playerId: string
  season: string
  split: string
  year: string
  record: string
  winRate: string
  kda: string
  csm: string
  gpm: string
  killParticipation: string
  dpm: string
  champions: Array<{ champion: string; games: number; winRate: string; kda: string }>
  availableSeasons: string[]
  availableSplits: string[]
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

// ─── Season map ───────────────────────────────────────────────────────────────

const SEASON_TO_CODE: Record<string, string> = {
  '2026': 'S16', '2025': 'S15', '2024': 'S14', '2023': 'S13',
  '2022': 'S12', '2021': 'S11', '2020': 'S10', '2019': 'S9',
  '2018': 'S8',  '2017': 'S7',  '2016': 'S6',
}
const CODE_TO_YEAR: Record<string, string> = Object.fromEntries(
  Object.entries(SEASON_TO_CODE).map(([y, c]) => [c, y])
)

const ALL_SEASONS = ['S16','S15','S14','S13','S12','S11','S10','S9','S8','S7','S6']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseRecord(record: string): { w: number; l: number } {
  const m = record.match(/(\d+)W-(\d+)L/)
  if (m) return { w: parseInt(m[1]), l: parseInt(m[2]) }
  return { w: 0, l: 0 }
}

function StatCell({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg bg-gray-800/50 px-4 py-3 text-center">
      <span className="text-lg font-bold text-white">{value}</span>
      {sub && <span className="text-[11px] text-gray-500">{sub}</span>}
      <span className="mt-0.5 text-xs text-gray-500">{label}</span>
    </div>
  )
}

function WinBar({ w, l }: { w: number; l: number }) {
  const total = w + l
  if (total === 0) return null
  const pct = Math.round((w / total) * 100)
  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span className="text-blue-400 font-semibold">{w}W</span>
        <span className="font-semibold text-gray-300">{pct}%</span>
        <span className="text-red-400 font-semibold">{l}L</span>
      </div>
      <div className="h-2 rounded-full bg-gray-700 overflow-hidden">
        <div
          className="h-full rounded-full bg-blue-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ─── Champion pool ────────────────────────────────────────────────────────────

function ChampionPool({
  champions,
  version,
}: {
  champions: GolStats['champions']
  version: string
}) {
  if (champions.length === 0) return (
    <p className="text-sm text-gray-500">No champion data.</p>
  )
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
            <th className="py-2 pr-3">Champion</th>
            <th className="py-2 pr-3 text-center">Games</th>
            <th className="py-2 pr-3 text-center">Win Rate</th>
            <th className="py-2 text-center">KDA</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/40">
          {champions.map((c) => (
            <tr key={c.champion} className="hover:bg-white/5">
              <td className="py-2 pr-3">
                <div className="flex items-center gap-2">
                  <img
                    src={champIconUrl(c.champion, version)}
                    alt={c.champion}
                    className="h-7 w-7 rounded-full border border-gray-700 bg-gray-800 object-cover"
                    onError={(e) => { ;(e.target as HTMLImageElement).style.display = 'none' }}
                  />
                  <span className="font-medium text-white">{c.champion}</span>
                </div>
              </td>
              <td className="py-2 pr-3 text-center text-gray-300">{c.games}</td>
              <td className="py-2 pr-3 text-center">
                {c.winRate ? (
                  <span className={parseFloat(c.winRate) >= 50 ? 'font-semibold text-green-400' : 'font-semibold text-red-400'}>
                    {c.winRate}%
                  </span>
                ) : <span className="text-gray-600">—</span>}
              </td>
              <td className="py-2 text-center text-gray-300">{c.kda || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Per-player match row ────────────────────────────────────────────────────

function PlayerMatchRow({ m, version }: { m: PlayerMatchEntry; version: string }) {
  const isWin = m.result === 'Win'
  return (
    <tr className={`border-b border-gray-800/40 hover:bg-white/5 ${isWin ? 'border-l-2 border-l-green-700' : 'border-l-2 border-l-red-800'}`}>
      {/* Match + tournament */}
      <td className="py-2.5 pl-3 pr-4">
        {m.gameId ? (
          <Link href={`/match/${m.gameId}`} className="font-semibold text-white hover:text-blue-300 text-sm">
            {m.matchName}
          </Link>
        ) : (
          <span className="font-semibold text-white text-sm">{m.matchName}</span>
        )}
        {m.tournament && (
          <div className="text-[11px] text-gray-500 mt-0.5">{m.tournament}</div>
        )}
        {m.date && (
          <div className="text-[11px] text-gray-600">{m.date}</div>
        )}
      </td>
      {/* Champion */}
      <td className="py-2.5 pr-3">
        <div className="flex items-center gap-1.5">
          <img
            src={champIconUrl(m.champion, version)}
            alt={m.champion}
            title={m.champion}
            className="h-6 w-6 rounded-full border border-gray-700 bg-gray-800 object-cover flex-shrink-0"
            onError={(e) => { ;(e.target as HTMLImageElement).style.display = 'none' }}
          />
          <span className="text-xs text-gray-300">{m.champion}</span>
        </div>
      </td>
      {/* Result */}
      <td className="py-2.5 pr-3">
        <span className={`text-xs font-bold ${isWin ? 'text-green-400' : 'text-red-400'}`}>
          {m.result}
        </span>
      </td>
      <td className="py-2.5 pr-3 text-xs text-gray-400 whitespace-nowrap">{m.duration || '—'}</td>
      <td className="py-2.5 pr-3 text-xs font-mono text-gray-300">{m.kda || '—'}</td>
      <td className="py-2.5 pr-3 text-xs text-gray-400">{m.csm || '—'}</td>
      <td className="py-2.5 pr-3 text-xs text-gray-400">{m.dpm || '—'}</td>
      <td className="py-2.5 pr-3 text-xs text-gray-400">{m.kp ? `${m.kp}%` : '—'}</td>
    </tr>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  playerName: string
  infoFields: InfoField[]
  wikiTimestamp: string
}

type Tab = 'stats' | 'champions' | 'matches' | 'career'

export default function PlayerProfile({ playerName, infoFields, wikiTimestamp }: Props) {
  const version = useDDragonVersion()
  const [tab, setTab] = useState<Tab>('stats')
  const [season, setSeason] = useState('S16')
  const [split, setSplit] = useState('ALL')
  const [matchSeason, setMatchSeason] = useState('S16')

  // ── GoL stats ──
  const { data: golStats, isLoading: golLoading, error: golError } = useSWR<GolStats>(
    `/api/gol/player/${encodeURIComponent(playerName)}?season=${season}&split=${split}`,
    (url: string) => fetch(url).then((r) => r.ok ? r.json() : r.json().then((e: { error?: string }) => Promise.reject(e.error ?? 'Not found'))),
    { revalidateOnFocus: false, keepPreviousData: true }
  )

  // ── Per-player match history ──
  const { data: matchData, isLoading: matchLoading } = useSWR<{ matches: PlayerMatchEntry[]; season: string; year: string }>(
    tab === 'matches' ? `/api/gol/player/${encodeURIComponent(playerName)}?matches=true&season=${matchSeason}` : null,
    (url: string) => fetch(url).then((r) => r.ok ? r.json() : Promise.reject('Failed')),
    { revalidateOnFocus: false, keepPreviousData: true }
  )

  // When GoL stats load, pick up available seasons/splits
  const availableSeasons = golStats?.availableSeasons ?? ALL_SEASONS
  const availableSplits = golStats?.availableSplits ?? ['ALL', 'Spring', 'Summer', 'Winter', 'Pre-Season']

  // ── Career timeline from infobox ──
  // Parse team fields from infobox: team1, team2, ..., teamn with corresponding dates
  const careerEntries = infoFields
    .filter((f) => /^team\d*$/.test(f.key.toLowerCase()) || f.key.toLowerCase().includes('former'))
    .map((f) => ({ label: f.key, value: f.value.replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, '$1').replace(/'''/g, '') }))

  const record = golStats?.record ? parseRecord(golStats.record) : null

  const TABS: { key: Tab; label: string }[] = [
    { key: 'stats', label: 'Season Stats' },
    { key: 'champions', label: 'Champions' },
    { key: 'matches', label: 'Recent Matches' },
    { key: 'career', label: 'Career' },
  ]

  return (
    <div className="space-y-5">
      {/* ── Tab bar ── */}
      <div className="flex gap-1 rounded-xl bg-gray-900 p-1 border border-gray-800">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
              tab === key
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Season / split selector (shown on stats + champions tabs) ── */}
      {(tab === 'stats' || tab === 'champions') && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500 mr-1">Season</span>
            {availableSeasons.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSeason(s)}
                className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
                  season === s
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {CODE_TO_YEAR[s] ?? s}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500 mr-1">Split</span>
            {availableSplits.map((sp) => (
              <button
                key={sp}
                type="button"
                onClick={() => setSplit(sp)}
                className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
                  split === sp
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {sp}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════ STATS TAB ══ */}
      {tab === 'stats' && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          {golLoading && !golStats && (
            <div className="space-y-2">
              {[1,2,3].map((i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-800/60" />)}
            </div>
          )}

          {!golLoading && golError && (
            <p className="text-sm text-gray-500">No GoL stats found for this player.</p>
          )}

          {golStats && !golError && (
            <div className={golLoading ? 'opacity-60 pointer-events-none' : ''}>
              <div className="mb-5">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                  {CODE_TO_YEAR[season] ?? season} — {split === 'ALL' ? 'Full Season' : split}
                </h2>
                {record && <WinBar w={record.w} l={record.l} />}
              </div>

              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                <StatCell label="Record" value={golStats.record || '—'} />
                <StatCell label="Win Rate" value={golStats.winRate ? `${golStats.winRate}%` : '—'} />
                <StatCell label="KDA" value={golStats.kda || '—'} />
                <StatCell label="CS/min" value={golStats.csm || '—'} />
                <StatCell label="Gold/min" value={golStats.gpm || '—'} />
                <StatCell label="Kill Part." value={golStats.killParticipation ? `${golStats.killParticipation}%` : '—'} />
              </div>

              {golStats.dpm && (
                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="rounded-lg bg-gray-800/40 p-3">
                    <p className="text-xs text-gray-500">Damage per Minute</p>
                    <p className="mt-1 text-xl font-bold text-white">{golStats.dpm}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═════════════════════════════════════════ CHAMPIONS TAB ══ */}
      {tab === 'champions' && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
            Champion Pool — {CODE_TO_YEAR[season] ?? season}
            {split !== 'ALL' ? ` / ${split}` : ''}
          </h2>
          {golLoading && !golStats && (
            <div className="space-y-2">
              {[1,2,3,4,5].map((i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-800/60" />)}
            </div>
          )}
          {!golLoading && golError && (
            <p className="text-sm text-gray-500">No champion data available.</p>
          )}
          {golStats && (
            <div className={golLoading ? 'opacity-60' : ''}>
              <ChampionPool champions={golStats.champions} version={version} />
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════ MATCHES TAB ══ */}
      {tab === 'matches' && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          {/* Season selector for matches */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Match History — {CODE_TO_YEAR[matchSeason] ?? matchSeason}
            </h2>
            <div className="flex flex-wrap gap-1">
              {ALL_SEASONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setMatchSeason(s)}
                  className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
                    matchSeason === s
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {CODE_TO_YEAR[s] ?? s}
                </button>
              ))}
            </div>
          </div>

          {matchLoading && !matchData && (
            <div className="space-y-2">
              {[1,2,3,4,5,6,7,8].map((i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-800/60" />)}
            </div>
          )}
          {!matchLoading && (!matchData?.matches || matchData.matches.length === 0) && (
            <p className="text-sm text-gray-500">No matches found for {CODE_TO_YEAR[matchSeason] ?? matchSeason}.</p>
          )}
          {matchData?.matches && matchData.matches.length > 0 && (
            <div className={`overflow-x-auto ${matchLoading ? 'opacity-60' : ''}`}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <th className="pb-2 pl-3 pr-4">Match</th>
                    <th className="pb-2 pr-3">Champion</th>
                    <th className="pb-2 pr-3">Result</th>
                    <th className="pb-2 pr-3">Time</th>
                    <th className="pb-2 pr-3">KDA</th>
                    <th className="pb-2 pr-3">CS/m</th>
                    <th className="pb-2 pr-3">DPM</th>
                    <th className="pb-2 pr-3">KP%</th>
                  </tr>
                </thead>
                <tbody>
                  {matchData.matches.map((m, i) => (
                    <PlayerMatchRow key={`${m.gameId}-${i}`} m={m} version={version} />
                  ))}
                </tbody>
              </table>
              <p className="mt-3 text-xs text-gray-600">
                {matchData.matches.length} games in {CODE_TO_YEAR[matchSeason] ?? matchSeason}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════ CAREER TAB ══ */}
      {tab === 'career' && (
        <div className="grid gap-5 md:grid-cols-2">
          {/* Info fields */}
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
              Player Info
            </h2>
            {infoFields.length === 0 ? (
              <p className="text-sm text-gray-500">No info available.</p>
            ) : (
              <dl className="space-y-2.5">
                {infoFields.slice(0, 16).map((f) => (
                  <div key={f.key} className="flex items-start justify-between gap-4">
                    <dt className="text-sm capitalize text-gray-500">{f.key}</dt>
                    <dd className="text-right text-sm font-medium text-white max-w-[60%] break-words">
                      {f.value.replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, '$1').replace(/'''/g, '')}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
            {wikiTimestamp && (
              <p className="mt-4 border-t border-gray-800 pt-3 text-xs text-gray-600">
                Wiki updated {new Date(wikiTimestamp).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Season-by-season record */}
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
              Career by Season
            </h2>
            <CareerSeasons playerName={playerName} />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Career seasons loader ─────────────────────────────────────────────────────

function CareerSeasons({ playerName }: { playerName: string }) {
  const [rows, setRows] = useState<Array<{ season: string; year: string; record: string; kda: string; csm: string }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setRows([])
    setLoading(true)

    async function load() {
      // Fetch all seasons in parallel
      const settled = await Promise.allSettled(
        ALL_SEASONS.map(async (s) => {
          const res = await fetch(`/api/gol/player/${encodeURIComponent(playerName)}?season=${s}&split=ALL`)
          if (!res.ok) return null
          const d: GolStats = await res.json()
          if (!d.record) return null
          return { season: s, year: CODE_TO_YEAR[s] ?? s, record: d.record, kda: d.kda, csm: d.csm }
        })
      )
      if (cancelled) return

      const results = settled
        .filter((r): r is PromiseFulfilledResult<NonNullable<{ season: string; year: string; record: string; kda: string; csm: string }>> =>
          r.status === 'fulfilled' && r.value !== null
        )
        .map((r) => r.value)

      // Sort most recent first
      results.sort((a, b) => (b.season > a.season ? 1 : -1))

      setRows(results)
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [playerName])

  if (loading && rows.length === 0) {
    return (
      <div className="space-y-2">
        {[1,2,3].map((i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-800/60" />)}
      </div>
    )
  }

  if (rows.length === 0) {
    return <p className="text-sm text-gray-500">No career data found.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
            <th className="pb-2 pr-4">Year</th>
            <th className="pb-2 pr-4">Record</th>
            <th className="pb-2 pr-4">KDA</th>
            <th className="pb-2">CS/min</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/40">
          {rows.map((r) => {
            const { w, l } = parseRecord(r.record)
            const total = w + l
            const pct = total > 0 ? Math.round((w / total) * 100) : 0
            return (
              <tr key={r.season} className="hover:bg-white/5">
                <td className="py-2 pr-4 font-semibold text-white">{r.year}</td>
                <td className="py-2 pr-4">
                  <span className="text-blue-400">{w}W</span>
                  <span className="mx-1 text-gray-600">-</span>
                  <span className="text-red-400">{l}L</span>
                  {total > 0 && (
                    <span className={`ml-2 text-xs font-semibold ${pct >= 50 ? 'text-green-400' : 'text-gray-500'}`}>
                      {pct}%
                    </span>
                  )}
                </td>
                <td className="py-2 pr-4 text-gray-300">{r.kda || '—'}</td>
                <td className="py-2 text-gray-300">{r.csm || '—'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
