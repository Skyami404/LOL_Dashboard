'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useWikiSearch } from '../lib/useWikiSearch'
import WikiPreview from './WikiPreview'

const TYPES = ['Players', 'Teams', 'Regions'] as const
type SearchType = (typeof TYPES)[number]

const REGIONS = [
  { label: 'LCK', slug: 'LCK' },
  { label: 'LPL', slug: 'LPL' },
  { label: 'LEC', slug: 'LEC' },
  { label: 'LCS', slug: 'LCS' },
  { label: 'PCS', slug: 'PCS' },
  { label: 'CBLOL', slug: 'CBLOL' },
  { label: 'LLA', slug: 'LLA' },
  { label: 'LCO', slug: 'LCO' },
  { label: 'LJL', slug: 'LJL' },
  { label: 'VCS', slug: 'VCS' },
]

function inferHref(title: string, type: SearchType) {
  if (type === 'Players') return `/players/${encodeURIComponent(title)}`
  if (type === 'Teams') return `/teams/${encodeURIComponent(title)}`
  if (type === 'Regions') return `/league/${encodeURIComponent(title)}`
  return null
}

function filterResults(results: { title: string }[]) {
  // Drop sub-pages (e.g. Faker/Statistics)
  return results.filter((r) => !r.title.includes('/'))
}

export default function SearchPanel() {
  const [query, setQuery] = useState('')
  const [type, setType] = useState<SearchType>('Players')
  const [selected, setSelected] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { results, isLoading } = useWikiSearch(query)
  const filtered = filterResults(results).slice(0, 8)

  useEffect(() => {
    setQuery('')
    inputRef.current?.focus()
  }, [type])

  return (
    <>
      <div className="rounded-xl bg-gray-900/80 p-5 shadow-xl border border-gray-800">
        {/* Type selector */}
        <div className="mb-3 flex rounded-lg border border-gray-700 overflow-hidden w-fit">
          {TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`px-5 py-2 text-sm font-semibold transition-colors ${
                type === t
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800/60 text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Search input */}
        {type !== 'Regions' && (
          <div className="relative">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={type === 'Players' ? 'Search by IGN...' : 'Search teams...'}
              className="w-full rounded-lg border border-gray-700 bg-gray-950/60 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
              autoComplete="off"
            />
            {isLoading && query.trim() && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
              </div>
            )}
          </div>
        )}

        {/* Regions grid */}
        {type === 'Regions' && (
          <div className="grid grid-cols-5 gap-2">
            {REGIONS.map(({ label, slug }) => (
              <Link
                key={slug}
                href={`/league/${slug}`}
                className="flex items-center justify-center rounded-lg border border-gray-700 bg-gray-800/60 py-3 text-sm font-bold text-white transition hover:border-blue-500 hover:bg-blue-900/30"
              >
                {label}
              </Link>
            ))}
          </div>
        )}

        {/* Results */}
        {type !== 'Regions' && query.trim() && (
          <div className="mt-3 space-y-1">
            {!isLoading && filtered.length === 0 && (
              <p className="text-sm text-gray-500">No results for &ldquo;{query}&rdquo;</p>
            )}
            {filtered.map((result) => {
              const href = inferHref(result.title, type)
              return (
                <div
                  key={result.title}
                  className="flex items-center gap-3 rounded-lg border border-gray-700/50 bg-gray-800/40 px-4 py-3 transition hover:border-blue-500/40 hover:bg-gray-800"
                >
                  <span className="flex-1 font-semibold text-white">{result.title}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelected(result.title)}
                      className="rounded bg-gray-700 px-2.5 py-1 text-xs text-gray-300 hover:bg-gray-600 hover:text-white"
                    >
                      Preview
                    </button>
                    {href && (
                      <Link
                        href={href}
                        className="rounded bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-500"
                      >
                        Open
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {selected && <WikiPreview title={selected} onClose={() => setSelected(null)} />}
    </>
  )
}
