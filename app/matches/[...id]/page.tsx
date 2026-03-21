import Link from 'next/link'
import { fetchWikiPage, parseInfobox, parseMatchScore, parseTable } from '../../../lib/wiki.server'

interface Props {
  params: { id: string[] }
}

export default async function MatchPage({ params }: Props) {
  const title = Array.isArray(params.id) ? params.id.join('/') : params.id
  const page = await fetchWikiPage(title)
  const infobox = page ? parseInfobox(page.content) : []
  const score = page ? parseMatchScore(page.content) : null
  const tables = page ? parseTable(page.content) : []

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white p-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm text-indigo-200 hover:text-white">
          ← Back to dashboard
        </Link>

        <header className="mt-4">
          <h1 className="text-4xl font-bold">{title.replace(/_/g, ' ')}</h1>
          <p className="mt-2 text-sm text-slate-300">Match page preview from LoL Esports Wiki</p>
        </header>

        {!page && (
          <div className="mt-6 rounded-lg bg-rose-900/30 p-6 text-slate-200">
            Match page not found.
          </div>
        )}

        {page && (
          <section className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="rounded-xl bg-white/10 p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-white">Match info</h2>
              <dl className="mt-4 space-y-3">
                {infobox.slice(0, 15).map((field) => (
                  <div key={field.key} className="flex justify-between">
                    <dt className="text-sm text-slate-300">{field.key}</dt>
                    <dd className="text-sm font-semibold text-white">{field.value}</dd>
                  </div>
                ))}
                {score && (
                  <div className="flex justify-between">
                    <dt className="text-sm text-slate-300">Detected score</dt>
                    <dd className="text-sm font-semibold text-white">{score.a} - {score.b}</dd>
                  </div>
                )}
              </dl>
            </div>

            {tables.length > 0 && (
              <div className="rounded-xl bg-white/10 p-6 shadow-lg">
                <h2 className="text-xl font-semibold text-white">Match History</h2>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm text-slate-100">
                    <thead>
                      <tr className="border-b border-slate-600">
                        {tables[0][0].map((header, i) => (
                          <th key={i} className="text-left p-2 font-semibold">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tables[0].slice(1).map((row, i) => (
                        <tr key={i} className="border-b border-slate-700">
                          {row.map((cell, j) => (
                            <td key={j} className="p-2">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="rounded-xl bg-white/10 p-6 shadow-lg md:col-span-2">
              <h2 className="text-xl font-semibold text-white">Raw page content</h2>
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
