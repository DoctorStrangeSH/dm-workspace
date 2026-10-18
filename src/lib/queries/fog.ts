import { createClient } from '@/lib/supabase/server'
import type { FogArea } from '@/lib/types'

export async function getFogAreas(sceneId: string): Promise<FogArea[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('fog_areas')
    .select('*')
    .eq('scene_id', sceneId)
    .eq('is_revealed', true)

  if (error) return []
  return (data ?? []) as FogArea[]
}