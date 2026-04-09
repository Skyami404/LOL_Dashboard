import Link from 'next/link'
import { fetchWikiPage, parseInfobox } from '../../../lib/wiki.server'
import PlayerProfile from '../../../components/PlayerProfile'

interface Props {
  params: { name: string }
}

const HIDDEN_FIELDS = new Set([
  'name', 'romanized name', 'birth date', 'birthdate', 'birth year',
  'born', 'age', 'full name', 'real name', 'legal name',
  'nativename', 'namealphabet',
])

function isHiddenField(key: string): boolean {
  const k = key.toLowerCase().trim()
  return HIDDEN_FIELDS.has(k) || k.startsWith('birth') || k.startsWith('native') || k.includes('pronoun')
}

export default async function PlayerPage({ params }: Props) {
  const title = decodeURIComponent(params.name)
  const page = await fetchWikiPage(title)
  const infobox = page ? parseInfobox(page.content) : []

  const displayName = title.replace(/_/g, ' ')

  const getField = (key: string) =>
    infobox.find((f) => f.key.toLowerCase().includes(key.toLowerCase()))?.value ?? ''

  const team = getField('team') || getField('current team')
  const role = getField('role') || getField('position')
  const country = getField('country') || getField('nationality') || getField('residency')

  const ROLE_LABELS: Record<string, string> = {
    Top: 'Top', Jungle: 'JGL', Mid: 'Mid', Bot: 'Bot', Support: 'Sup', ADC: 'Bot',
  }

  const visibleFields = infobox.filter(
    (f) => f.value && !f.key.startsWith('image') && !f.key.startsWith('checkbox')
      && !f.key.startsWith('is') && !f.key.startsWith('to') && !f.key.startsWith('low')
      && !isHiddenField(f.key) && !f.key.startsWith('favchamp') && !f.key.startsWith('ids')
      && !f.key.startsWith('stream') && !f.key.startsWith('facebook') && !f.key.startsWith('twitter')
      && !f.key.startsWith('instagram') && !f.key.startsWith('videoarchive') && !f.key.startsWith('page_type')
  )

  return (
    <main className="min-h-screen bg-gray-950 pb-16 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900 px-4 py-6">
        <div className="mx-auto max-w-6xl">
          <Link href="/" className="text-sm text-gray-400 hover:text-white">
            Back
          </Link>
          <div className="mt-4 flex items-start gap-5">
            {/* Avatar: role abbreviation */}
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-blue-900/40 text-xl font-black text-blue-300 ring-1 ring-blue-700/50">
              {role ? (ROLE_LABELS[role] ?? role.slice(0, 3).toUpperCase()) : displayName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">{displayName}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {role && (
                  <span className="rounded bg-gray-800 px-2.5 py-1 text-xs font-semibold text-gray-200">
                    {role}
                  </span>
                )}
                {team && (
                  <Link
                    href={`/teams/${encodeURIComponent(team)}`}
                    className="rounded bg-blue-900/50 px-2.5 py-1 text-xs font-semibold text-blue-300 hover:bg-blue-900"
                  >
                    {team}
                  </Link>
                )}
                {country && (
                  <span className="text-sm text-gray-400">{country}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {!page && (
        <div className="mx-auto max-w-6xl px-4 pt-6">
          <div className="rounded-xl border border-red-800 bg-red-900/20 p-6 text-red-300">
            No wiki page found for <strong>{displayName}</strong>.
          </div>
        </div>
      )}

      {page && (
        <div className="mx-auto max-w-6xl px-4 pt-6">
          {/* Client-side interactive profile: season stats, matches, champions, career */}
          <PlayerProfile
            playerName={displayName}
            infoFields={visibleFields}
            wikiTimestamp={page.timestamp}
          />
        </div>
      )}
    </main>
  )
}
