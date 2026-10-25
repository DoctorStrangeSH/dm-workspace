import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { SceneWall } from '@/lib/types'

export async function getSceneWalls(sceneId: string): Promise<SceneWall[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('scene_walls')
    .select('*')
    .eq('scene_id', sceneId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('getSceneWalls error:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    })
    return []
  }

  return (data ?? []) as SceneWall[]
}
