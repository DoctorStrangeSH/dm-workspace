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
export async function searchSrdMonstersAction(filters: MonsterFilters = {}): Promise<SrdMonster[]> {
  const { query, cr, type, size, limit = 100 } = filters

  const hasFilters =
    (query && query.trim()) ||
    (cr && cr.length > 0) ||
    (type && type.length > 0) ||
    (size && size.length > 0)

  if (!hasFilters) {
    return getCachedMonsters(limit)
  }

  // С фильтрами — используем серверный клиент (с cookies, RLS-контекст)
  const supabase = await createClient()
  let q = supabase.from('srd_monsters').select('*')

  if (query?.trim()) {
    q = q.or(`name.ilike.%${query.trim()}%,name_ru.ilike.%${query.trim()}%`)
  }

  if (cr && cr.length > 0) {
    q = q.in('data->>cr', cr)
  }

  if (type && type.length > 0) {
    q = q.in('data->>type', type)
  }

  if (size && size.length > 0) {
    q = q.in('data->>size', size)
  }

  q = q.order('name').limit(limit)

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
