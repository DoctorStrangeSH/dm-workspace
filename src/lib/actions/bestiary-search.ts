'use server'

import { createClient } from '@/lib/supabase/server'

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

export async function searchSrdMonstersAction(filters: MonsterFilters = {}): Promise<SrdMonster[]> {
  const supabase = await createClient()
  const { query, cr, type, size, limit = 100 } = filters

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

export async function getAvailableCRs(): Promise<string[]> {
  const supabase = await createClient()
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
}
