import { NextRequest } from 'next/server'
import { fetchOracleRows, aggregatePlayerStats } from '../../../../../lib/oracle.server'

export async function GET(_req: NextRequest, { params }: { params: { name: string } }) {
  try {
    const rows = await fetchOracleRows()
    const stats = aggregatePlayerStats(rows, decodeURIComponent(params.name))
    if (!stats) {
      return Response.json(
        { error: 'Player not found in 2026 Oracle Elixir data' },
        { status: 404 }
      )
    }
    return Response.json(stats)
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
