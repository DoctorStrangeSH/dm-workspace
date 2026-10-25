'use server'

import { unstable_cache } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createSrdClient } from '@/lib/supabase/srd'

export interface MonsterFilters {
  query?: string
  cr?: string[]
  type?: string[]
  size?: string[]
  limit?: number
}

export interface SrdMonster {
  key: string
  name: string
  name_ru: string | null
  data: any
}

/**
 * CHANGES: searchSrdMonstersAction НЕ кэшируем — фильтры динамические.
 * Но если query/cr/type/size пустые — возвращаем кэшированный базовый список.
 */
function sanitizeSearchQuery(query: unknown): string {
  if (typeof query !== 'string') return ''
  return query.trim().slice(0, 100).replace(/[,%().*\\_]/g, ' ').replace(/\s+/g, ' ')
}

function normalizeLimit(limit: unknown): number {
  if (typeof limit !== 'number' || !Number.isFinite(limit)) return 100
  return Math.min(100, Math.max(1, Math.floor(limit)))
}

function sanitizeStringFilters(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((entry): entry is string => typeof entry === 'string' && entry.length > 0 && entry.length <= 80)
    .slice(0, 30)
}

export async function searchSrdMonstersAction(filters: MonsterFilters = {}): Promise<SrdMonster[]> {
  const { query, cr, type, size, limit = 100 } = filters
  const searchQuery = sanitizeSearchQuery(query)
  const safeLimit = normalizeLimit(limit)
  const safeCr = sanitizeStringFilters(cr)
  const safeType = sanitizeStringFilters(type)
  const safeSize = sanitizeStringFilters(size)

  const hasFilters =
    Boolean(searchQuery) ||
    (cr && cr.length > 0) ||
    (type && type.length > 0) ||
    (size && size.length > 0)

  if (!hasFilters) {
    return getCachedMonsters(safeLimit)
  }

  // С фильтрами — используем серверный клиент (с cookies, RLS-контекст)
  const supabase = await createClient()
  let q = supabase.from('srd_monsters').select('*')

  if (searchQuery) {
    q = q.or(`name.ilike.%${searchQuery}%,name_ru.ilike.%${searchQuery}%`)
  }

  if (safeCr.length > 0) {
    q = q.in('data->>cr', safeCr)
  }

  if (safeType.length > 0) {
    q = q.in('data->>type', safeType)
  }

  if (safeSize.length > 0) {
    q = q.in('data->>size', safeSize)
  }

  q = q.order('name').limit(safeLimit)

  const { data, error } = await q

  if (error) {
    console.error('searchSrdMonstersAction error:', error)
    return []
  }

  return (data ?? []) as SrdMonster[]
}

// CHANGES: кэшированный базовый список (без cookies — createSrdClient).
const getCachedMonsters = unstable_cache(
  async (limit: number): Promise<SrdMonster[]> => {
    const supabase = createSrdClient()
    const { data, error } = await supabase
      .from('srd_monsters')
      .select('*')
      .order('name')
      .limit(limit)

    if (error) return []
    return (data ?? []) as SrdMonster[]
  },
  ['srd-monsters-base'],
  { revalidate: 3600, tags: ['srd'] }
)

// CHANGES: кэшированный список CR (без cookies).
export const getAvailableCRs = unstable_cache(
  async (): Promise<string[]> => {
    const supabase = createSrdClient()
    const { data } = await supabase.from('srd_monsters').select('data->>cr').limit(10000)

    const crs = new Set<string>()
    data?.forEach((row: any) => {
      const cr = row.cr
      if (cr) crs.add(String(cr))
    })

    return Array.from(crs).sort((a, b) => {
      const toNum = (s: string) => {
        if (s.includes('/')) {
          const [num, den] = s.split('/').map(Number)
          return num / den
        }
        return Number(s) || 0
      }
      return toNum(a) - toNum(b)
    })
  },
  ['srd-available-crs'],
  { revalidate: 3600, tags: ['srd'] }
)
