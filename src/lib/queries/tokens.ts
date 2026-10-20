import { createClient } from '@/lib/supabase/server'
import type { Token } from '@/lib/types'

export async function getSceneTokens(sceneId: string): Promise<Token[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tokens')
    .select('*')
    .eq('scene_id', sceneId)
    .order('created_at')

  if (error) return []
  return (data ?? []) as Token[]
}
