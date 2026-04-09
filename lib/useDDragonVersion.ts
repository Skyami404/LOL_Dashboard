'use client'

import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useDDragonVersion() {
  const { data } = useSWR<{ version: string }>('/api/ddragon', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 3_600_000, // 1 hour
  })
  return data?.version ?? '16.7.1'
}
