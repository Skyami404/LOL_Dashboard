import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const res = await fetch('https://gol.gg/esports/ajax.home.php', {
    method: 'POST',
    body,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'X-Requested-With': 'XMLHttpRequest',
      'Origin': 'https://gol.gg',
      'Referer': 'https://gol.gg/esports/',
    },
  })
  if (!res.ok) {
    return new Response(JSON.stringify({ error: 'Failed to fetch from gol.gg' }), {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  const data = await res.json()
  return Response.json(data)
}
