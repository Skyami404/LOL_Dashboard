/**
 * Utilities for parsing LoL Esports Wiki pages (wikitext) and extracting structured data.
 */

const WIKI_API_BASE = 'https://lol.fandom.com/api.php'

export async function fetchWikiRaw(title: string) {
  const res = await fetch(
    `${WIKI_API_BASE}?action=query&prop=revisions&rvprop=content&titles=${encodeURIComponent(
      title
    )}&format=json&origin=*`
  )

  if (!res.ok) {
    throw new Error(`Failed to fetch wiki page: ${res.status}`)
  }

  const data = await res.json()
  const page = data.query.pages[Object.keys(data.query.pages)[0]]
  if (page.missing) return null
  return page.revisions?.[0]?.['*'] ?? ''
}

export function cleanWikiMarkup(value: string) {
  return value
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]+)\]\]/g, '$1') // [[Foo|Bar]] -> Bar, [[Foo]] -> Foo
    .replace(/\{\{(?:[^\}|]*\|)?([^\}]+)\}\}/g, '$1') // {{Foo|Bar}} -> Bar, {{Foo}} -> Foo
    .replace(/'''/g, '')
    .replace(/''/g, '')
    .replace(/<br ?\/?>(\s*)/gi, ' ')
    .replace(/<.*?>/g, '')
    .trim()
}

export function extractInfoboxFields(content: string) {
  const fields: Record<string, string> = {}

  // Find the first {{Infobox ... }} block (balanced braces)
  const start = content.search(/\{\{Infobox/i)
  if (start === -1) return fields

  let depth = 0
  let end = start
  for (let i = start; i < content.length; i++) {
    if (content[i] === '{' && content[i + 1] === '{') {
      depth++
      i++
      continue
    }
    if (content[i] === '}' && content[i + 1] === '}') {
      depth--
      i++
      if (depth === 0) {
        end = i + 1
        break
      }
      continue
    }
  }

  const infobox = content.slice(start, end)

  const lines = infobox.split(/\r?\n/)
  for (const line of lines) {
    const match = line.match(/^\s*\|\s*([^=|]+?)\s*=\s*(.+)$/)
    if (match) {
      const key = match[1].trim().toLowerCase()
      const value = cleanWikiMarkup(match[2].trim())
      fields[key] = value
    }
  }

  return fields
}

export function parseRosterSections(content: string) {
  const sections: Record<string, string[]> = {}

  const teamHeaderRegex = /^===\s*\{\{team\|([^}]+)\}\}\s*===/gm
  let match: RegExpExecArray | null
  const boundaries: Array<{ team: string; start: number; end: number }> = []

  while ((match = teamHeaderRegex.exec(content)) !== null) {
    boundaries.push({ team: match[1].trim(), start: match.index, end: match.index })
  }

  for (let i = 0; i < boundaries.length; i++) {
    const team = boundaries[i].team
    const start = boundaries[i].start
    const end = i + 1 < boundaries.length ? boundaries[i + 1].start : content.length
    const section = content.slice(start, end)

    const playerNames: string[] = []
    const playerRegex = /\{\{ExtendedRoster\/Line\|[^}]*?player=([^|}]+)[^}]*?\}\}/g
    let pMatch: RegExpExecArray | null
    while ((pMatch = playerRegex.exec(section)) !== null) {
      playerNames.push(cleanWikiMarkup(pMatch[1].trim()))
    }

    if (playerNames.length > 0) {
      sections[team] = playerNames
    }
  }

  return sections
}

export async function findRosterPageCandidate(years: number[] = []) {
  // Try to find a known "Team Rosters" page for a given year.
  for (const year of years) {
    const title = `LCK/${year} Season/Cup/Team Rosters`
    const content = await fetchWikiRaw(title)
    if (content) return { title, content }
  }

  // Fall back to searching for the most recent "Team Rosters" page via wiki search
  const res = await fetch(
    `${WIKI_API_BASE}?action=query&list=search&srsearch="Team Rosters"&format=json&origin=*`
  )
  if (!res.ok) return null
  const body = await res.json()
  const first = body.query?.search?.[0]?.title
  if (!first) return null

  const content = await fetchWikiRaw(first)
  if (!content) return null
  return { title: first, content }
}

export async function findPlayerCurrentTeam(playerName: string) {
  const now = new Date().getFullYear()
  const years = [now, now - 1, now - 2]
  const rosterPage = await findRosterPageCandidate(years)
  if (!rosterPage) return null

  const sections = parseRosterSections(rosterPage.content)
  const normalized = playerName.toLowerCase().replace(/\s+/g, '')

  for (const [team, players] of Object.entries(sections)) {
    if (players.some((p) => p.toLowerCase().replace(/\s+/g, '') === normalized)) {
      return team
    }
  }

  // Fallback: try to match by partial name (first/last)
  for (const [team, players] of Object.entries(sections)) {
    if (players.some((p) => p.toLowerCase().includes(normalized))) {
      return team
    }
  }

  return null
}

export async function getTeamRoster(teamName: string, year?: number) {
  const now = new Date().getFullYear()
  const years = year ? [year] : [now, now - 1, now - 2]
  const rosterPage = await findRosterPageCandidate(years)
  if (!rosterPage) return []

  const sections = parseRosterSections(rosterPage.content)
  return sections[teamName] ?? []
}

export async function getRosterPages(years: number[] = []) {
  const now = new Date().getFullYear()
  if (years.length === 0) years = [now, now - 1, now - 2]

  const pages: Array<{ year: number; title: string; sections: Record<string, string[]> }> = []

  for (const year of years) {
    const title = `LCK/${year} Season/Cup/Team Rosters`
    const content = await fetchWikiRaw(title)
    if (!content) continue
    const sections = parseRosterSections(content)
    pages.push({ year, title, sections })
  }

  return pages
}

export async function getPlayerCareer(playerName: string, years: number[] = []) {
  const pages = await getRosterPages(years)
  const normalized = playerName.toLowerCase().replace(/\s+/g, '')
  const career: Array<{ year: number; team: string }> = []

  for (const page of pages) {
    for (const [team, players] of Object.entries(page.sections)) {
      if (players.some((p) => p.toLowerCase().replace(/\s+/g, '') === normalized)) {
        career.push({ year: page.year, team })
        break
      }
    }
  }

  return career
}
