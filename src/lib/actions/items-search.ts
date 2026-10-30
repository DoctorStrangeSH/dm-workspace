'use server'

import { createClient } from '@/lib/supabase/server'
import { ITEM_PAGE_SIZE } from '@/lib/item-catalog'

export interface ItemFilters {
  query?: string
  type?: string[]
  rarity?: string[]
  limit?: number
}

export interface SrdItem {
  key: string
  name: string
  name_ru: string | null
  data: any
}

export type SrdItemsPageResult = { ok: true; items: SrdItem[]; hasNext: boolean } | { ok: false }

function sanitizeSearchQuery(query: unknown): string {
  if (typeof query !== 'string') return ''
  return query
    .trim()
    .slice(0, 100)
    .replace(/[,%().*\\_]/g, ' ')
    .replace(/\s+/g, ' ')
}

function normalizeLimit(limit: unknown): number {
  if (typeof limit !== 'number' || !Number.isFinite(limit)) return 100
  return Math.min(100, Math.max(1, Math.floor(limit)))
}

function sanitizeStringFilters(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter(
      (entry): entry is string =>
        typeof entry === 'string' && entry.length > 0 && entry.length <= 80
    )
    .slice(0, 30)
}

export async function searchSrdItemsAction(filters: ItemFilters = {}): Promise<SrdItem[]> {
  const supabase = await createClient()
  const { query, type, rarity, limit = 100 } = filters
  const searchQuery = sanitizeSearchQuery(query)
  const safeLimit = normalizeLimit(limit)
  const safeType = sanitizeStringFilters(type)
  const safeRarity = sanitizeStringFilters(rarity)

  let q = supabase.from('srd_items').select('*')

  if (searchQuery) {
    q = q.or(`name.ilike.%${searchQuery}%,name_ru.ilike.%${searchQuery}%`)
  }

  if (safeType.length > 0) {
    q = q.in('data->>item_type', safeType)
  }

  if (safeRarity.length > 0) {
    q = q.in('data->>rarity', safeRarity)
  }

  q = q.order('name').limit(safeLimit)

  const { data, error } = await q

  if (error) {
    console.error('searchSrdItemsAction error:', error)
    return []
  }

  return (data ?? []) as SrdItem[]
}

/** A stable ordered page with one lookahead row; errors are distinct from no matches. */
export async function searchSrdItemsPageAction(
  filters: ItemFilters = {},
  offset = 0
): Promise<SrdItemsPageResult> {
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > 100000) return { ok: false }
  if (!filters || typeof filters !== 'object' || Array.isArray(filters)) return { ok: false }
  try {
    const supabase = await createClient()
    const query = sanitizeSearchQuery(filters.query)
    const types = sanitizeStringFilters(filters.type)
    const rarities = sanitizeStringFilters(filters.rarity)
    let q = supabase.from('srd_items').select('*')
    if (query) q = q.or(`name.ilike.%${query}%,name_ru.ilike.%${query}%`)
    if (types.length > 0) q = q.in('data->>item_type', types)
    if (rarities.length > 0) q = q.in('data->>rarity', rarities)
    const { data, error } = await q
      .order('name')
      .order('key')
      .range(offset, offset + ITEM_PAGE_SIZE)
    if (error) {
      console.error('searchSrdItemsPageAction error:', error)
      return { ok: false }
    }
    const rows = data ?? []
    return {
      ok: true,
      items: rows.slice(0, ITEM_PAGE_SIZE) as SrdItem[],
      hasNext: rows.length > ITEM_PAGE_SIZE,
    }
  } catch {
    return { ok: false }
  }
}

export async function getAvailableItemTypes(): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('srd_items').select('data->>item_type').limit(10000)

  const types = new Set<string>()
  data?.forEach((row: any) => {
    if (row.item_type) types.add(row.item_type)
  })

  return Array.from(types).sort()
}

export async function getAvailableRarities(): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('srd_items').select('data->>rarity').limit(10000)

  const rarities = new Set<string>()
  data?.forEach((row: any) => {
    if (row.rarity) rarities.add(row.rarity)
  })

  return Array.from(rarities).sort()
}

/** Read every catalog page; the Data API can cap each response at 1000 rows. */
export async function getAvailableItemFilters(): Promise<{ types: string[]; rarities: string[] }> {
  const supabase = await createClient()
  const types = new Set<string>()
  const rarities = new Set<string>()
  for (let start = 0; start < 10000; start += 500) {
    const { data, error } = await supabase
      .from('srd_items')
      .select('key, data->>item_type, data->>rarity')
      .order('key')
      .range(start, start + 499)
    if (error) {
      console.error('getAvailableItemFilters error:', error)
      return { types: [], rarities: [] }
    }
    for (const row of data ?? []) {
      if (typeof row.item_type === 'string' && row.item_type) types.add(row.item_type)
      if (typeof row.rarity === 'string' && row.rarity) rarities.add(row.rarity)
    }
    if (!data || data.length < 500) break
  }
  return { types: Array.from(types).sort(), rarities: Array.from(rarities).sort() }
}
