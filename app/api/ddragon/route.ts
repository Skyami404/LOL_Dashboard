export async function GET() {
  const res = await fetch('https://ddragon.leagueoflegends.com/api/versions.json', {
    next: { revalidate: 3600 },
  })
  if (!res.ok) {
    return Response.json({ version: '16.7.1' })
  }
  const versions: string[] = await res.json()
  return Response.json({ version: versions[0] })
}
