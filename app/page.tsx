import SearchPanel from '../components/SearchPanel'
import RecentMatches from '../components/RecentMatches'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Hero */}
      <div className="border-b border-gray-800 bg-gray-900 px-4 py-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-bold text-white">
            LoL Esports <span className="text-blue-400">Dashboard</span>
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Live match data, player stats, and team rosters
          </p>
          <div className="mt-5">
            <SearchPanel />
          </div>
        </div>
      </div>

      {/* Recent Matches — full width, primary content */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        <RecentMatches />
      </div>
    </main>
  )
}
