import Link from 'next/link'
import { fetchWikiPage, parseInfobox } from '../../../lib/wiki.server'
import { getPlayerCareer } from '../../../lib/wiki'

interface Props {
  params: { name: string }
}

export default async function PlayerPage({ params }: Props) {
  const title = params.name
  const page = await fetchWikiPage(title)
  const infobox = page ? parseInfobox(page.content) : []
  const career = page ? await getPlayerCareer(title) : []

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white p-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm text-indigo-200 hover:text-white">
          ← Back to dashboard
        </Link>

        <header className="mt-4 flex flex-col gap-2">
          <h1 className="text-4xl font-bold">{title.replace(/_/g, ' ')}</h1>
          <p className="text-sm text-slate-300">Player profile from LoL Esports Wiki</p>
        </header>

        {!page && (
          <div className="mt-6 rounded-lg bg-rose-900/30 p-6 text-slate-200">
            Could not find a page for this player.
          </div>
        )}

        {page && (
          <section className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="rounded-xl bg-white/10 p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-white">Quick stats</h2>
              <dl className="mt-4 space-y-3">
                {infobox.slice(0, 12).map((field) => (
                  <div key={field.key} className="flex justify-between">
                    <dt className="text-sm text-slate-300">{field.key}</dt>
                    <dd className="text-sm font-semibold text-white">{field.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="rounded-xl bg-white/10 p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-white">Career (Recent years)</h2>
              {career.length === 0 ? (
                <p className="mt-2 text-sm text-slate-300">No roster history found in recent seasons.</p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {career.map((entry) => (
                    <li key={`${entry.year}-${entry.team}`} className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-indigo-200">{entry.year}</span>
                      <Link
                        href={`/teams/${encodeURIComponent(entry.team)}`}
                        className="text-sm text-white hover:text-indigo-100"
                      >
                        {entry.team}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-xl bg-white/10 p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-white">Page info</h2>
              <p className="mt-2 text-sm text-slate-300">Last updated: {page.timestamp ? new Date(page.timestamp).toLocaleString() : 'Unknown'}</p>
              <p className="mt-4 text-sm text-slate-200">Full wiki text loaded below.</p>
              <pre className="mt-4 max-h-72 overflow-y-auto rounded bg-slate-900/60 p-4 text-xs text-slate-100">
                {page.content.slice(0, 2000)}
                {page.content.length > 2000 ? '…' : ''}
              </pre>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
