'use client'

import { useMemo, useState } from 'react'
import { useWikiSearch, WikiSearchResult } from '../lib/useWikiSearch'
import WikiPreview from './WikiPreview'

const TYPES = ['Players', 'Teams', 'Matches', 'Tournaments'] as const

type SearchType = (typeof TYPES)[number]

export default function SearchPanel() {
  const [query, setQuery] = useState('')
  const [type, setType] = useState<SearchType>('Players')
  const [selected, setSelected] = useState<string | null>(null)
  const { results, isLoading, error } = useWikiSearch(query)

  const filtered = useMemo(() => {
    if (!query.trim()) return []
    if (type === 'Players') return results.filter((r) => r.title.toLowerCase().includes('player') || /\b\w+\s\w+\b/.test(r.title))
    if (type === 'Teams')
      return results.filter((r) =>
        r.title.toLowerCase().includes('team') || r.title.toLowerCase().includes('t1') || r.title.toLowerCase().includes('fnatic')
      )
    if (type === 'Matches')
      return results.filter((r) => r.title.toLowerCase().includes('season') || r.title.toLowerCase().includes('match'))
    if (type === 'Tournaments')
      return results.filter((r) => r.title.toLowerCase().includes('championship') || r.title.toLowerCase().includes('world'))
    return results
  }, [results, type, query])

  return (
    <>
      <div className="rounded-xl bg-slate-900/60 p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search players, teams, matches..."
            className="w-full rounded border border-slate-700 bg-slate-950/40 px-4 py-2 text-sm text-white placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 md:w-2/3"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value as SearchType)}
            className="w-full rounded border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 md:w-1/4"
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-5">
          {isLoading && <p className="text-sm text-slate-300">Searching...</p>}
          {error && <p className="text-sm text-rose-300">{error}</p>}
          {!isLoading && !error && query.trim().length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {filtered.length === 0 ? (
                <div className="rounded-lg border border-slate-700 bg-slate-950/40 p-4 text-sm text-slate-200">
                  No results found.
                </div>
              ) : (
                filtered.map((result) => (
                  <SearchResultCard
                    key={result.title}
                    type={type}
                    result={result}
                    onSelect={() => setSelected(result.title)}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {selected && <WikiPreview title={selected} onClose={() => setSelected(null)} />}
    </>
  )
}

function renderSnippet(snippet: string) {
  const clean = snippet.replace(/<span class="searchmatch">/g, '<strong>').replace(/<\/span>/g, '</strong>')
  return <span dangerouslySetInnerHTML={{ __html: clean }} />
}

function inferHref(title: string, type: SearchType) {
  const safe = encodeURIComponent(title)
  if (type === 'Players') return `/players/${safe}`
  if (type === 'Teams') return `/teams/${safe}`
  if (type === 'Matches') return `/matches/${safe}`
  if (type === 'Tournaments') return `/league/${safe}`
  return null
}

function SearchResultCard({ result, type, onSelect }: { result: WikiSearchResult; type: SearchType; onSelect: () => void }) {
  const href = inferHref(result.title, type)

  return (
    <div className="group w-full rounded-lg border border-slate-700 bg-white/10 p-4 text-sm text-slate-100 shadow-sm backdrop-blur transition hover:border-indigo-300 hover:bg-white/15">
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          {href ? (
            <a href={href} className="text-lg font-semibold text-white group-hover:text-indigo-100">
              {result.title}
            </a>
          ) : (
            <h3 className="text-lg font-semibold text-white group-hover:text-indigo-100">{result.title}</h3>
          )}
          <button
            type="button"
            onClick={onSelect}
            className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/20"
          >
            Preview
          </button>
        </div>
        <p className="text-xs text-slate-200">{renderSnippet(result.snippet)}</p>
        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
          <span>Last updated {new Date(result.timestamp).toLocaleDateString()}</span>
          {href && <span className="font-medium text-indigo-200 group-hover:text-indigo-100">Open ↗</span>}
        </div>
      </div>
    </div>
  )
}
