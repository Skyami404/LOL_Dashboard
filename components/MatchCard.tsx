'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

interface Match {
  title: string;
  lastModified: string;
}

export default function MatchCard({ matchPage }: { matchPage: string }) {
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatch = async () => {
      try {
        const response = await axios.get(`https://lol.fandom.com/api.php?action=query&prop=revisions&rvprop=content|timestamp&titles=${encodeURIComponent(matchPage)}&format=json&origin=*`);
        const page = response.data.query.pages[Object.keys(response.data.query.pages)[0]];
        if (page.missing) {
          throw new Error('Page not found');
        }
        const revision = page.revisions[0];
        setMatch({
          title: page.title,
          lastModified: revision.timestamp,
        });
      } catch (error) {
        console.error('Error fetching match data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatch();
    const interval = setInterval(fetchMatch, 300000); // Update every 5 minutes

    return () => clearInterval(interval);
  }, [matchPage]);

  if (loading) return <div className="bg-slate-800/60 p-4 rounded-lg animate-pulse" />;

  if (!match)
    return (
      <div className="bg-rose-900/50 p-4 rounded-lg text-white">
        Match not found
      </div>
    );

  return (
    <div className="bg-white/10 shadow-lg rounded-lg p-5 border border-white/10 text-white">
      <h3 className="text-lg font-bold">{match.title}</h3>
      <p className="mt-2 text-sm text-slate-200">Last modified: {new Date(match.lastModified).toLocaleString()}</p>
    </div>
  );
}