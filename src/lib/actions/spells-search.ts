'use server'

import { createClient } from '@/lib/supabase/server'

export interface SpellFilters {
  query?: string
  level?: number[]
  school?: string[]
  limit?: number
}

export interface SrdSpell {
  key: string
  name: string
  name_ru: string | null
  data: any
}

export async function searchSrdSpellsAction(filters: SpellFilters = {}): Promise<SrdSpell[]> {
  const supabase = await createClient()
  const { query, level, school, limit = 100 } = filters

  let q = supabase.from('srd_spells').select('*')

  if (query?.trim()) {
    q = q.or(`name.ilike.%${query.trim()}%,name_ru.ilike.%${query.trim()}%`)
  }

  if (level && level.length > 0) {
    q = q.in('data->>level', level.map(String))
  }

  if (school && school.length > 0) {
    q = q.in('data->>school', school)
  }

  q = q.order('name').limit(limit)

  const { data, error } = await q

  if (error) {
    console.error('searchSrdSpellsAction error:', error)
    return []
  }

  return (data ?? []) as SrdSpell[]
}

export async function getAvailableSpellLevels(): Promise<number[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('srd_spells').select('data->>level').limit(10000)

  const levels = new Set<number>()
  data?.forEach((row: any) => {
    const lvl = Number(row.level)
    if (!isNaN(lvl)) levels.add(lvl)
  })

  return Array.from(levels).sort((a, b) => a - b)
}
