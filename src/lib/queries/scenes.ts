import { createClient } from '@/lib/supabase/server'
import type { Scene } from '@/lib/types'

export async function getScenes(campaignId: string): Promise<Scene[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('scenes')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getScenes error:', error)
    return []
  }
  return (data ?? []) as Scene[]
}

export async function getScene(
  sceneId: string
): Promise<Scene | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('scenes')
    .select('*')
    .eq('id', sceneId)
    .single()
  return (data as Scene) ?? null
}

export async function getActiveScene(
  campaignId: string
): Promise<Scene | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('scenes')
    .select('*')
    .eq('campaign_id', campaignId)
    .eq('is_active', true)
    .maybeSingle()
  return (data as Scene) ?? null
}