'use client';

import { useEffect, useState } from 'react';
import { fetchWikiRaw, extractInfoboxFields, getTeamRoster } from '../lib/wiki';

export default function TeamCard({ teamName }: { teamName: string }) {
  const [roster, setRoster] = useState<string[] | null>(null);
  const [region, setRegion] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const content = await fetchWikiRaw(teamName);
        if (content) {
          const fields = extractInfoboxFields(content);
          setRegion(fields.region || fields.country || null);
        }

        const teamRoster = await getTeamRoster(teamName);
        setRoster(teamRoster);
      } catch (error) {
        console.error('Error fetching team data:', error);
        setRoster([]);
        setRegion(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, [teamName]);

  return (
    <div className="bg-white/10 shadow-lg rounded-lg p-5 border border-white/10">
      <h3 className="text-lg font-bold text-white">{teamName}</h3>
      {loading ? (
        <p className="mt-2 text-sm text-slate-200">Loading roster…</p>
      ) : (
        <>
          {region && <p className="mt-2 text-sm text-slate-200">Region: {region}</p>}
          {roster && roster.length > 0 ? (
            <p className="mt-2 text-sm text-slate-200">
              Players: {roster.slice(0, 5).join(', ')}{roster.length > 5 ? `, +${roster.length - 5} more` : ''}
            </p>
          ) : (
            <p className="mt-2 text-sm text-slate-200">Roster not found on the wiki.</p>
          )}
        </>
      )}
    </div>
  );
}
