/**
 * Convert a champion display name (as returned by GoL API) to a Data Dragon key.
 * Data Dragon keys strip spaces and apostrophes, with a few special cases.
 */
const SPECIAL_CASES: Record<string, string> = {
  'Wukong': 'MonkeyKing',
  'Nunu & Willump': 'Nunu',
  'Renata Glasc': 'Renata',
  'Bel\'Veth': 'Belveth',
  'Cho\'Gath': 'Chogath',
  'Dr. Mundo': 'DrMundo',
  'Kai\'Sa': 'Kaisa',
  'Kha\'Zix': 'Khazix',
  'LeBlanc': 'Leblanc',
  'Vel\'Koz': 'Velkoz',
}

export function champToKey(name: string): string {
  if (!name) return ''
  if (SPECIAL_CASES[name]) return SPECIAL_CASES[name]
  // Remove apostrophes, spaces, periods
  return name.replace(/['\s.]/g, '')
}

export function champIconUrl(name: string, version: string): string {
  const key = champToKey(name)
  if (!key) return ''
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${key}.png`
}
