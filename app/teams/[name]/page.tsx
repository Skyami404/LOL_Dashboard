import Link from 'next/link'
import { fetchWikiPage, parseInfobox } from '../../../lib/wiki.server'
import { getRosterPages, getTeamRoster } from '../../../lib/wiki'
import TeamStats from '../../../components/TeamStats'

interface Props {
  params: { name: string }
  searchParams?: { year?: string }
}

const ROLE_ORDER = ['Top', 'Jungle', 'Mid', 'Bot', 'Support', 'ADC', 'Coach', 'Manager']

export default async function TeamPage({ params, searchParams }: Props) {
  const teamName = decodeURIComponent(params.name)
  const year = searchParams?.year ? Number(searchParams.year) : new Date().getFullYear()

  const page = await fetchWikiPage(teamName)
  const infobox = page ? parseInfobox(page.content) : []

  const rosterYears = (
    await getRosterPages([
      new Date().getFullYear(),
      new Date().getFullYear() - 1,
      new Date().getFullYear() - 2,
    ])
  ).map((r) => r.year)

  const roster = await getTeamRoster(teamName, year)
  const displayName = teamName.replace(/_/g, ' ')

  const getField = (key: string) =>
    infobox.find((f) => f.key.toLowerCase().includes(key.toLowerCase()))?.value ?? ''

  const region = getField('region') || getField('league') || getField('country')

  return (
    <main className="min-h-screen bg-gray-950 pb-12 text-white">
      <div className="border-b border-gray-800 bg-gray-900 px-4 py-6">
        <div className="mx-auto max-w-5xl">
          <Link href="/" className="text-sm text-gray-400 hover:text-white">
            Back
          </Link>
          <div className="mt-4 flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-blue-900/40 text-2xl font-extrabold text-blue-300 ring-1 ring-blue-700/50">
              {displayName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-extrabold">{displayName}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {region && (
                  <span className="rounded bg-gray-800 px-2.5 py-1 text-xs font-medium text-gray-200">
                    {region}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-6 px-4 pt-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Team info */}
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
              Team Info
            </h2>
            <dl className="space-y-3">
              {infobox
                .filter((f) => f.value && !f.key.startsWith('image'))
                .slice(0, 12)
                .map((field) => (
                  <div key={field.key} className="flex items-start justify-between gap-4">
                    <dt className="text-sm text-gray-500">{field.key}</dt>
                    <dd className="text-right text-sm font-medium text-white">
                      {field.value
                        .replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, '$1')
                        .replace(/'''/g, '')}
                    </dd>
                  </div>
                ))}
              {infobox.length === 0 && (
                <p className="text-sm text-gray-600">No structured info available.</p>
              )}
            </dl>
          </div>

          {/* Roster */}
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                Roster
              </h2>
              <div className="flex items-center gap-1">
                {rosterYears.map((y) => (
                  <Link
                    key={y}
                    href={`/teams/${encodeURIComponent(teamName)}?year=${y}`}
                    className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
                      y === year
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    {y}
                  </Link>
                ))}
              </div>
            </div>

            {roster.length === 0 ? (
              <p className="text-sm text-gray-600">No roster data found for {year}.</p>
            ) : (
              <ul className="space-y-2">
                {roster.map((player) => {
                  const role = ROLE_ORDER.find((r) =>
                    player.toLowerCase().includes(r.toLowerCase())
                  )
                  return (
                    <li key={player}>
                      <Link
                        href={`/players/${encodeURIComponent(player)}`}
                        className="flex items-center gap-3 rounded-lg border border-gray-800 bg-gray-800/40 p-3 hover:border-blue-700 hover:bg-gray-800"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-700 text-xs font-bold text-gray-300">
                          {role ? role.slice(0, 3).toUpperCase() : player[0]?.toUpperCase()}
                        </div>
                        <span className="font-semibold text-white">{player}</span>
                        {role && (
                          <span className="ml-auto text-xs text-gray-500">{role}</span>
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>

        <TeamStats teamName={displayName} />
      </div>
    </main>
  )
}
