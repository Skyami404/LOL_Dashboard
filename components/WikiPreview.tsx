'use client'

import { useEffect, useMemo, useState } from 'react'
import { fetchWikiRaw, extractInfoboxFields, parseRosterSections } from '../lib/wiki'

interface InfoboxField {
  key: string
  value: string
}

interface WikiPreviewProps {
  title: string
  onClose: () => void
}

// Personal identity fields to hide from player pages
const HIDDEN_FIELD_KEYS = new Set([
  'name',
  'romanized name',
  'birth date',
  'birthdate',
  'birth year',
  'born',
  'age',
  'full name',
  'real name',
  'legal name',
])

function isHiddenField(key: string): boolean {
  const k = key.toLowerCase().trim()
  return HIDDEN_FIELD_KEYS.has(k) || k.startsWith('birth')
}

export default function WikiPreview({ title, onClose }: WikiPreviewProps) {
  const [fields, setFields] = useState<InfoboxField[]>([])
  const [rosters, setRosters] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPage = async () => {
      setLoading(true)
      setError(null)
      try {
        const content = await fetchWikiRaw(title)
        if (!content) {
          setError('Page not found')
          setFields([])
          setRosters({})
          return
        }

        const rawFields = Object.entries(extractInfoboxFields(content)).map(([k, v]) => ({
          key: k,
          value: v,
        }))
        // Filter out personal identity fields
        setFields(rawFields.filter((f) => !isHiddenField(f.key)))
        setRosters(parseRosterSections(content))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load page')
        setFields([])
        setRosters({})
      } finally {
        setLoading(false)
      }
    }

    fetchPage()
  }, [title])

  const parsedTitle = useMemo(() => title.replace(/_/g, ' '), [title])

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-6 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-3xl rounded-2xl bg-slate-950/95 p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">{parsedTitle}</h2>
            <p className="mt-1 text-sm text-slate-400">Wiki Preview</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white hover:bg-white/20"
          >
            Close ✕
          </button>
        </div>

        <div className="mt-6">
          {loading && (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-white/5" />
              ))}
            </div>
          )}
          {error && <p className="text-sm text-rose-300">{error}</p>}

          {!loading && !error && fields.length === 0 && Object.keys(rosters).length === 0 && (
            <p className="text-sm text-slate-300">No infobox or roster data found on this page.</p>
          )}

          {!loading && !error && fields.length > 0 && (
            <div className="grid gap-3 md:grid-cols-2">
              {fields.slice(0, 20).map((field) => (
                <div key={field.key} className="rounded-lg bg-white/10 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {field.key}
                  </p>
                  <p className="mt-1 text-sm text-white">{field.value}</p>
                </div>
              ))}
            </div>
          )}

          {!loading && !error && Object.keys(rosters).length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-white">Roster</h3>
              <div className="mt-3 space-y-3">
                {Object.entries(rosters)
                  .slice(0, 3)
                  .map(([team, players]) => (
                    <div key={team} className="rounded-lg bg-white/10 p-4">
                      <p className="text-sm font-semibold text-indigo-200">{team}</p>
                      <p className="mt-1 text-sm text-slate-100">{players.join(', ')}</p>
                    </div>
                  ))}
                {Object.keys(rosters).length > 3 && (
                  <p className="text-xs text-slate-400">
                    Showing first 3 teams. Open the full wiki page for the complete roster.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
