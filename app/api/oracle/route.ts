import { NextResponse } from 'next/server'
import Papa from 'papaparse'

const DEFAULT_CSV_URL =
  'https://oracleselixir-downloadable-match-data.s3.amazonaws.com/2026_LoL_esports_matches.csv'

export async function GET() {
  const url = process.env.ORACLE_ELIXIR_CSV_URL ?? DEFAULT_CSV_URL

  // Validate the configured URL early to avoid build-time failures.
  try {
    // eslint-disable-next-line no-new
    new URL(url)
  } catch {
    return NextResponse.json(
      {
        error:
          'Invalid ORACLE_ELIXIR_CSV_URL. Please set a valid CSV URL in .env.local (or remove the placeholder).',
        url,
      },
      { status: 400 }
    )
  }

  const response = await fetch(url, {
    // Automatically revalidate and refetch at most once per minute (60s)
    // This makes the dashboard update quickly when new CSV data is added.
    next: { revalidate: 60 },
  })
  if (!response.ok) {
    return NextResponse.json({ error: 'Failed to fetch data from Oracle Elixir' }, { status: 502 })
  }

  const csvText = await response.text()
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  })

  return NextResponse.json({
    source: 'oracle-elixir',
    url,
    fetchedAt: new Date().toISOString(),
    rowCount: parsed.data.length,
    data: parsed.data,
    errors: parsed.errors,
  })
}
