'use server'

import { createClient } from '@/lib/supabase/server'

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
