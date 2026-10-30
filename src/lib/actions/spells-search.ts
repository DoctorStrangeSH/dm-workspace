'use server'

import { createClient } from '@/lib/supabase/server'
import { CATALOG_PAGE_SIZE, validCatalogOffset, type CatalogPage } from '@/lib/srd/catalog-page'

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

export async function searchSrdSpellsAction(filters: SpellFilters = {}): Promise<SrdSpell[]> {
  const supabase = await createClient()
  const { query, level, school, limit = 100 } = filters
  const searchQuery = sanitizeSearchQuery(query)
  const safeLimit = normalizeLimit(limit)
  const safeSchool = sanitizeStringFilters(school)
  const safeLevel = Array.isArray(level)
    ? level
        .filter((entry): entry is number => Number.isInteger(entry) && entry >= 0 && entry <= 9)
        .slice(0, 10)
    : []

  let q = supabase.from('srd_spells').select('*')

  if (searchQuery) {
    q = q.or(`name.ilike.%${searchQuery}%,name_ru.ilike.%${searchQuery}%`)
  }

  if (safeLevel.length > 0) {
    q = q.in('data->>level', safeLevel.map(String))
  }

  if (safeSchool.length > 0) {
    q = q.in('data->>school', safeSchool)
  }

  q = q.order('name').limit(safeLimit)

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

export async function searchSrdSpellsPageAction(
  filters: SpellFilters = {},
  offset = 0
): Promise<CatalogPage<SrdSpell>> {
  if (
    !validCatalogOffset(offset) ||
    !filters ||
    typeof filters !== 'object' ||
    Array.isArray(filters)
  )
    return { ok: false }
  try {
    const supabase = await createClient()
    const query = sanitizeSearchQuery(filters.query)
    const levels = Array.isArray(filters.level)
      ? filters.level.filter((n) => Number.isInteger(n) && n >= 0 && n <= 9).slice(0, 10)
      : []
    // The UI uses lowercase keys; retained Open5e rows use title-case names.
    const schools = [
      ...new Set(
        sanitizeStringFilters(filters.school).flatMap((s) => {
          const lower = s.trim().toLowerCase()
          return [lower, lower.charAt(0).toUpperCase() + lower.slice(1)]
        })
      ),
    ]
    let q = supabase.from('srd_spells').select('*')
    if (query) q = q.or(`name.ilike.%${query}%,name_ru.ilike.%${query}%`)
    if (levels.length) q = q.in('data->>level', levels.map(String))
    if (schools.length) q = q.in('data->>school', schools)
    const { data, error } = await q
      .order('name')
      .order('key')
      .range(offset, offset + CATALOG_PAGE_SIZE)
    if (error) return { ok: false }
    const rows = data ?? []
    return {
      ok: true,
      items: rows.slice(0, CATALOG_PAGE_SIZE),
      hasNext: rows.length > CATALOG_PAGE_SIZE,
    }
  } catch {
    return { ok: false }
  }
}
