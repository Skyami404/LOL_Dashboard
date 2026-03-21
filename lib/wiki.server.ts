export async function fetchWikiPage(title: string) {
  const res = await fetch(
    `https://lol.fandom.com/api.php?action=query&prop=revisions&rvprop=content|timestamp&titles=${encodeURIComponent(
      title
    )}&format=json&origin=*`,
    { next: { revalidate: 300 } }
  )

  if (!res.ok) {
    throw new Error(`Failed to fetch wiki page: ${res.status}`)
  }

  const data = await res.json()
  const page = data.query.pages[Object.keys(data.query.pages)[0]]
  if (page.missing) {
    return null
  }
  return {
    title: page.title,
    content: page.revisions?.[0]?.['*'] ?? '',
    timestamp: page.revisions?.[0]?.timestamp ?? '',
  }
}

export function parseInfobox(content: string) {
  const infoboxMatch = content.match(/\{\{Infobox[^]*?\n\}\}/i)
  if (!infoboxMatch) return []
  const infobox = infoboxMatch[0]
  const lines = infobox.split('\n').slice(1)
  const fields: Array<{ key: string; value: string }> = []

  for (const line of lines) {
    const match = line.match(/^\s*\|\s*([^=|]+?)\s*=\s*(.+?)\s*$/)
    if (match) {
      fields.push({ key: match[1].trim(), value: match[2].trim() })
    }
  }

  return fields
}

export function parseMatchScore(content: string) {
  const scoreMatch = content.match(/\b(\d+)-(\d+)\b/)
  if (!scoreMatch) return null
  return { a: parseInt(scoreMatch[1], 10), b: parseInt(scoreMatch[2], 10) }
}

export function parseTable(content: string) {
  const tableRegex = /\{\|[\s\S]*?\n\|\}/g
  const tables = []
  let match
  while ((match = tableRegex.exec(content)) !== null) {
    const tableContent = match[0]
    const rows = tableContent.split('\n').filter(line => line.trim().startsWith('|'))
    const parsedRows = rows.map(row => {
      const cells = row.split('||').map(cell => cell.replace(/^\|\s*/, '').trim())
      return cells
    })
    if (parsedRows.length > 0) {
      tables.push(parsedRows)
    }
  }
  return tables
}
