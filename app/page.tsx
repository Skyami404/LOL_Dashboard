'use client'

import SearchPanel from '../components/SearchPanel'
import PlayerCard from '../components/PlayerCard'
import TeamCard from '../components/TeamCard'
import MatchCard from '../components/MatchCard'
import TournamentCard from '../components/TournamentCard'
import RecentMatches from '../components/RecentMatches'

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white p-8">
      <header className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-bold">LoL Esports Dashboard</h1>
            <p className="mt-2 text-sm text-slate-200">
              Search players, teams, matches and tournaments with live wiki updates.
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <RecentMatches />
          </div>
        </div>
      </header>

      <section className="mx-auto mt-8 max-w-6xl">
        <SearchPanel />
      </section>

      <section className="mx-auto mt-10 max-w-6xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Players</h2>
          <PlayerCard playerName="Faker" />
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Teams</h2>
          <TeamCard teamName="T1" />
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Matches</h2>
          <MatchCard matchPage="LEC/2024_Season/Summer_Season" />
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Tournaments</h2>
          <TournamentCard tournamentPage="World_Championship" />
        </div>
      </section>
    </main>
  );
}