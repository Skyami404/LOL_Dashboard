'use client';

import { useState, useEffect } from 'react';
import { fetchWikiRaw, extractInfoboxFields, findPlayerCurrentTeam } from '../lib/wiki';

interface Player {
  name: string;
  team: string;
  role: string;
  country: string;
}

export default function PlayerCard({ playerName }: { playerName: string }) {
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlayer = async () => {
      try {
        const content = await fetchWikiRaw(playerName);
        if (!content) {
          setPlayer(null);
          return;
        }

        const fields = extractInfoboxFields(content);
        const inferredTeam = await findPlayerCurrentTeam(playerName);

        setPlayer({
          name: playerName,
          team: fields.team || fields.currentteam || inferredTeam || 'Unknown',
          role: fields.role || fields.position || 'Unknown',
          country: fields.country || fields.nat || fields.nationality || 'Unknown',
        });
      } catch (error) {
        console.error('Error fetching player data:', error);
        setPlayer(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayer();
    const interval = setInterval(fetchPlayer, 300000); // Update every 5 minutes

    return () => clearInterval(interval);
  }, [playerName]);

  if (loading) return <div className="bg-slate-800/60 p-4 rounded-lg animate-pulse" />;

  if (!player)
    return (
      <div className="bg-rose-900/50 p-4 rounded-lg text-white">
        Player not found
      </div>
    );

  return (
    <div className="bg-white/10 shadow-lg rounded-lg p-5 border border-white/10">
      <h3 className="text-lg font-bold text-white">{player.name}</h3>
      <p className="mt-2 text-sm text-slate-200">Team: {player.team}</p>
      <p className="mt-1 text-sm text-slate-200">Role: {player.role}</p>
      <p className="mt-1 text-sm text-slate-200">Country: {player.country}</p>
    </div>
  );
}