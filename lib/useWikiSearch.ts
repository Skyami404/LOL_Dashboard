import { useEffect, useState } from 'react'
import axios from 'axios'

export interface WikiSearchResult {
  ns: number
  title: string
  snippet: string
  size: number
  wordcount: number
  timestamp: string
}

export function useWikiSearch(query: string, delay: number = 300) {
  const [results, setResults] = useState<WikiSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setError(null)
      setIsLoading(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await axios.get(
          `https://lol.fandom.com/api.php?action=query&list=search&srsearch=${encodeURIComponent(
            query
          )}&srlimit=15&format=json&origin=*`
        )
        setResults(response.data.query.search || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch search results')
      } finally {
        setIsLoading(false)
      }
    }, delay)

    return () => clearTimeout(timer)
  }, [query, delay])

  return { results, isLoading, error }
}
