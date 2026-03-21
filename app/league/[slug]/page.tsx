import Link from 'next/link'
import { fetchWikiPage, parseInfobox, parseTable } from '../../../lib/wiki.server'

interface Props {
  params: { slug: string }
}

export default async function LeaguePage({ params }: Props) {
  const title = params.slug
  const page = await fetchWikiPage(title)
  const infobox = page ? parseInfobox(page.content) : []
  const tables = page ? parseTable(page.content) : []

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white p-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm text-indigo-200 hover:text-white">
          ← Back to dashboard
        </Link>

        <header className="mt-4">
          <h1 className="text-4xl font-bold">{title.replace(/_/g, ' ')}</h1>
          <p className="mt-2 text-sm text-slate-300">League/tournament overview from LoL Esports Wiki</p>
        </header>

        {!page && (
          <div className="mt-6 rounded-lg bg-rose-900/30 p-6 text-slate-200">
            League page not found.
          </div>
        )}

        {page && (
          <section className="mt-6 space-y-6">
            <div className="rounded-xl bg-white/10 p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-white">Key info</h2>
              <dl className="mt-4 space-y-3">
                {infobox.slice(0, 15).map((field) => (
                  <div key={field.key} className="flex justify-between">
                    <dt className="text-sm text-slate-300">{field.key}</dt>
                    <dd className="text-sm font-semibold text-white">{field.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {tables.map((table, tableIndex) => (
              <div key={tableIndex} className="rounded-xl bg-white/10 p-6 shadow-lg">
                <h2 className="text-xl font-semibold text-white">
                  {tableIndex === 0 ? 'Standings' : tableIndex === 1 ? 'Schedule' : `Table ${tableIndex + 1}`}
                </h2>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm text-slate-100">
                    <thead>
                      <tr className="border-b border-slate-600">
                        {table[0].map((header, i) => (
                          <th key={i} className="text-left p-2 font-semibold">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {table.slice(1).map((row, i) => (
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
            ))}

            <div className="rounded-xl bg-white/10 p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-white">Page snapshot</h2>
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
