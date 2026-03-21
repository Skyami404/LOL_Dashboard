import Link from 'next/link'
import { fetchWikiPage, parseInfobox } from '../../../lib/wiki.server'
import { getRosterPages, getTeamRoster } from '../../../lib/wiki'

interface Props {
  params: { name: string }
  searchParams?: { year?: string }
}

export default async function TeamPage({ params, searchParams }: Props) {
  const teamName = params.name
  const year = searchParams?.year ? Number(searchParams.year) : new Date().getFullYear()

  const page = await fetchWikiPage(teamName)
  const infobox = page ? parseInfobox(page.content) : []

  const rosterYears = (await getRosterPages([new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2])).map((r) => r.year)
  const roster = await getTeamRoster(teamName, year)

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white p-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm text-indigo-200 hover:text-white">
          ← Back to dashboard
        </Link>

        <header className="mt-4 flex flex-col gap-2">
          <h1 className="text-4xl font-bold">{teamName.replace(/_/g, ' ')}</h1>
          <p className="text-sm text-slate-300">Team roster and info (from LoL Esports Wiki)</p>
        </header>

        <section className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl bg-white/10 p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-white">Key info</h2>
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
            <h2 className="text-xl font-semibold text-white">Roster (Season)</h2>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-sm text-slate-300">Year:</span>
              {rosterYears.map((y) => (
                <Link
                  key={y}
                  href={`/teams/${encodeURIComponent(teamName)}?year=${y}`}
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${
                    y === year ? 'bg-indigo-500 text-white' : 'bg-white/10 text-slate-200 hover:bg-white/20'
                  }`}
                >
                  {y}
                </Link>
              ))}
            </div>

            <div className="mt-6">
              {roster.length === 0 ? (
                <p className="text-sm text-slate-300">No roster data found for this year.</p>
              ) : (
                <ul className="space-y-2">
                  {roster.map((player) => (
                    <li key={player} className="rounded-lg bg-white/10 p-3">
                      <Link href={`/players/${encodeURIComponent(player)}`} className="text-sm font-semibold text-indigo-200 hover:text-indigo-100">
                        {player}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        {page && (
          <section className="mt-6 rounded-xl bg-white/10 p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-white">Page snapshot</h2>
            <pre className="mt-4 max-h-72 overflow-y-auto rounded bg-slate-900/60 p-4 text-xs text-slate-100">
              {page.content.slice(0, 2000)}
              {page.content.length > 2000 ? '…' : ''}
            </pre>
          </section>
        )}
      </div>
    </main>
  )
}
