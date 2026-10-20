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

export async function searchSrdItemsAction(filters: ItemFilters = {}): Promise<SrdItem[]> {
  const supabase = await createClient()
  const { query, type, rarity, limit = 100 } = filters

  let q = supabase.from('srd_items').select('*')

  if (query?.trim()) {
    q = q.or(`name.ilike.%${query.trim()}%,name_ru.ilike.%${query.trim()}%`)
  }

  if (type && type.length > 0) {
    q = q.in('data->>item_type', type)
  }

  if (rarity && rarity.length > 0) {
    q = q.in('data->>rarity', rarity)
  }

  q = q.order('name').limit(limit)

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
