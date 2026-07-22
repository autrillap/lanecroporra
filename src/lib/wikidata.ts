const WIKIDATA_URL_PATTERN = /^https:\/\/(www\.)?wikidata\.org\/w\/api\.php\?action=wb(getentities|searchentities)&/
const WIKIDATA_ALLOWED_ACTIONS = ['wbgetentities', 'wbsearchentities']

export function isValidWikidataUrl(url: string): boolean {
  if (url.length > 500) return false
  return WIKIDATA_URL_PATTERN.test(url)
}

export function buildWikidataEntityUrl(ids: string[]): string {
  const validIds = ids
    .filter(id => /^Q\d+$/.test(id))
    .slice(0, 50)
  if (validIds.length === 0) throw new Error('No valid Wikidata IDs provided')
  return `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${validIds.join('|')}&props=claims&format=json&origin=*`
}

export function buildWikidataSearchUrl(query: string): string {
  const sanitized = String(query).replace(/[^a-zA-Z0-9áéíóúñüÁÉÍÓÚÑÜ ]/g, '').trim().slice(0, 200)
  if (!sanitized) throw new Error('Invalid search query')
  return `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(sanitized)}&language=es&format=json&origin=*&type=item`
}

export async function fetchWikidata<T>(url: string, timeoutMs = 10000): Promise<T> {
  if (!isValidWikidataUrl(url)) throw new Error('Invalid Wikidata URL')

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) throw new Error(`Wikidata API error: ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(timeout)
  }
}
