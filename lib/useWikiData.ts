import { useState, useEffect } from 'react';
import axios from 'axios';

interface WikiData {
  title: string;
  content: string;
  lastModified: string;
}

export function useWikiData(pageTitle: string, refreshInterval: number = 300000) {
  const [data, setData] = useState<WikiData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `https://lol.fandom.com/api.php?action=query&prop=revisions&rvprop=content|timestamp&titles=${encodeURIComponent(pageTitle)}&format=json&origin=*`
      );
      const page = response.data.query.pages[Object.keys(response.data.query.pages)[0]];
      if (page.missing) {
        throw new Error('Page not found');
      }
      const revision = page.revisions[0];
      setData({
        title: page.title,
        content: revision['*'],
        lastModified: revision.timestamp,
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [pageTitle, refreshInterval]);

  return { data, error, isLoading, refresh: fetchData };
}