import { unstable_cache } from 'next/cache'
import { createSrdClient } from '@/lib/supabase/srd'

export interface SrdSpecies {
  key: string
  name: string
  name_ru: string | null
  data: any
}

export interface SrdClass {
  key: string
  name: string
  name_ru: string | null
  data: any
}

// CHANGES: кэшируем SRD-запросы на 1 час.
// Используем createSrdClient() (без cookies) — иначе unstable_cache падает.
export const getSrdSpecies = unstable_cache(
  async (): Promise<SrdSpecies[]> => {
    const supabase = createSrdClient()
    const { data, error } = await supabase.from('srd_species').select('*').order('name')
    if (error) return []
    return data ?? []
  },
  ['srd-species'],
  { revalidate: 3600, tags: ['srd'] }
)

export const getSrdClasses = unstable_cache(
  async (): Promise<SrdClass[]> => {
    const supabase = createSrdClient()
    const { data, error } = await supabase.from('srd_classes').select('*').order('name')
    if (error) return []
    return data ?? []
  },
  ['srd-classes'],
  { revalidate: 3600, tags: ['srd'] }
)

export const getSrdBackgrounds = unstable_cache(
  async () => {
    const supabase = createSrdClient()
    const { data } = await supabase.from('srd_backgrounds').select('*').order('name')
    return data ?? []
  },
  ['srd-backgrounds'],
  { revalidate: 3600, tags: ['srd'] }
)
