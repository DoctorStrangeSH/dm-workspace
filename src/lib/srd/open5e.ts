const BASE_URL = 'https://api.open5e.com/v2'
const DOCUMENT_KEY = 'srd-2024'

interface ListResponse<T> {
  count: number
  results: T[]
  next: string | null
}

/**
 * Загружает ВСЕ записи с пагинацией.
 */
export async function fetchAllPages<T>(
  endpoint: string,
  filters: string = ''
): Promise<T[]> {
  const all: T[] = []
  let url: string | null = `${BASE_URL}${endpoint}?document__key=${DOCUMENT_KEY}&limit=100${filters}`

  while (url) {
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`Open5e error: ${res.status} ${res.statusText} at ${url}`)
    }
    const data: ListResponse<T> = await res.json()
    all.push(...data.results)
    url = data.next
    console.log(`  📥 Загружено: ${all.length}`)
  }

  return all
}

/**
 * Загружает заклинания 2024.
 */
export async function fetchSpells2024(): Promise<any[]> {
  return fetchAllPages('/spells/')
}

/**
 * Загружает существ (монстров) 2024.
 */
export async function fetchCreatures2024(): Promise<any[]> {
  return fetchAllPages('/creatures/')
}

/**
 * Загружает предметы 2024.
 */
export async function fetchItems2024(): Promise<any[]> {
  return fetchAllPages('/items/')
}

/**
 * Загружает виды (расы) 2024.
 */
export async function fetchSpecies2024(): Promise<any[]> {
  return fetchAllPages('/species/')
}

/**
 * Загружает классы 2024.
 */
export async function fetchClasses2024(): Promise<any[]> {
  return fetchAllPages('/classes/')
}

/**
 * Загружает предыстории 2024.
 */
export async function fetchBackgrounds2024(): Promise<any[]> {
  return fetchAllPages('/backgrounds/')
}