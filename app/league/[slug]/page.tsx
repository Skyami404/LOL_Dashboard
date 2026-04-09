import Link from 'next/link'
import LeagueMatches from '../../../components/LeagueMatches'

interface Props {
  params: { slug: string }
}

const KNOWN_REGIONS: Record<string, string> = {
  LCK: 'LCK – League Champions Korea',
  LPL: 'LPL – League of Legends Pro League',
  LEC: 'LEC – LoL EMEA Championship',
  LCS: 'LCS – League Championship Series',
  PCS: 'PCS – Pacific Championship Series',
  CBLOL: 'CBLOL – Campeonato Brasileiro',
  LLA: 'LLA – Liga Latinoamérica',
  LCO: 'LCO – League of Legends Circuit Oceania',
  LJL: 'LJL – League of Legends Japan League',
  VCS: 'VCS – Vietnam Championship Series',
}

export default function LeaguePage({ params }: Props) {
  const slug = decodeURIComponent(params.slug)
  const displayName = KNOWN_REGIONS[slug.toUpperCase()] ?? slug.replace(/_/g, ' ')

  return (
    <main className="min-h-screen bg-gray-950 pb-12 text-white">
      <div className="border-b border-gray-800 bg-gray-900 px-4 py-6">
        <div className="mx-auto max-w-5xl">
          <Link href="/" className="text-sm text-gray-400 hover:text-white">
            Back
          </Link>
          <div className="mt-4">
            <h1 className="text-3xl font-extrabold">{displayName}</h1>
            <p className="mt-1 text-sm text-gray-400">Recent matches — live updating</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 pt-6">
        <LeagueMatches tournament={slug} />
      </div>
    </main>
  )
}
