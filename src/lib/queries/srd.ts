import { createClient } from '@/lib/supabase/server'

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

export async function getSrdSpecies(): Promise<SrdSpecies[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('srd_species').select('*').order('name')
  if (error) return []
  return data ?? []
}

export async function getSrdClasses(): Promise<SrdClass[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('srd_classes').select('*').order('name')
  if (error) return []
  return data ?? []
}

export async function getSrdBackgrounds() {
  const supabase = await createClient()
  const { data } = await supabase.from('srd_backgrounds').select('*').order('name')
  return data ?? []
}
