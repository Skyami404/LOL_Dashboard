'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

interface Tournament {
  title: string;
  lastModified: string;
}

export default function TournamentCard({ tournamentPage }: { tournamentPage: string }) {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTournament = async () => {
      try {
        const response = await axios.get(`https://lol.fandom.com/api.php?action=query&prop=revisions&rvprop=content|timestamp&titles=${encodeURIComponent(tournamentPage)}&format=json&origin=*`);
        const page = response.data.query.pages[Object.keys(response.data.query.pages)[0]];
        if (page.missing) {
          throw new Error('Page not found');
        }
        const revision = page.revisions[0];
        setTournament({
          title: page.title,
          lastModified: revision.timestamp,
        });
      } catch (error) {
        console.error('Error fetching tournament data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTournament();
    const interval = setInterval(fetchTournament, 300000); // Update every 5 minutes

    return () => clearInterval(interval);
  }, [tournamentPage]);

  if (loading) return <div className="bg-slate-800/60 p-4 rounded-lg animate-pulse" />;

  if (!tournament)
    return (
      <div className="bg-rose-900/50 p-4 rounded-lg text-white">
        Tournament not found
      </div>
    );

  return (
    <div className="bg-white/10 shadow-lg rounded-lg p-5 border border-white/10 text-white">
      <h3 className="text-lg font-bold">{tournament.title}</h3>
      <p className="mt-2 text-sm text-slate-200">Last modified: {new Date(tournament.lastModified).toLocaleString()}</p>
    </div>
  );
}