'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'

interface TickerEntry {
  title: string
  updated: string
  url: string
}

// Simple ticker that searches for pages mentioning "LIVE" or "in progress" and rotates them
export default function LiveTicker() {
  const [entries, setEntries] = useState<TickerEntry[]>([])
  const [active, setActive] = useState(0)

  useEffect(() => {
    const fetchTicker = async () => {
      try {
        const resp = await axios.get(
          'https://lol.fandom.com/api.php?action=query&list=search&srsearch=vs%20score&srwhat=text&srlimit=20&format=json&origin=*'
        )
        const results = resp.data.query.search || []
        const items: TickerEntry[] = results.slice(0, 8).map((r: any) => ({
          title: r.title,
          updated: r.timestamp,
          url: `https://lol.fandom.com/wiki/${encodeURIComponent(r.title)}`,
        }))
        setEntries(items)
      } catch {
        setEntries([])
      }
    }

    fetchTicker()
    const interval = setInterval(fetchTicker, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (entries.length === 0) return
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % entries.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [entries])

  if (entries.length === 0) {
    return (
      <div className="rounded-xl bg-white/10 p-4 text-sm text-slate-200 shadow-lg">
        <strong className="text-white">Live ticker</strong> — no active items found.
      </div>
    )
  }

  const activeEntry = entries[active]

  return (
    <div className="rounded-xl bg-white/10 p-4 text-sm text-slate-100 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-semibold text-white">Live ticker</span>
        <span className="text-xs text-slate-300">Rotating every 5s</span>
      </div>
      <a
        className="mt-2 block text-sm font-semibold text-indigo-200 hover:text-indigo-100"
        href={activeEntry.url}
        target="_blank"
        rel="noreferrer"
      >
        {activeEntry.title}
      </a>
      <p className="mt-1 text-xs text-slate-300">Updated: {new Date(activeEntry.updated).toLocaleString()}</p>
    </div>
  )
}
