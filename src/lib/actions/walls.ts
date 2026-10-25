'use server'

import { createClient } from '@/lib/supabase/server'
import { getCampaignAccess } from '@/lib/queries/access'
import { revalidatePath } from 'next/cache'
import type { SceneWall } from '@/lib/types'

export async function createWall(
  sceneId: string,
  campaignId: string,
  wall: { x1: number; y1: number; x2: number; y2: number; color?: string }
): Promise<{ error: string } | { success: true; wall: SceneWall }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { isDm, isMember } = await getCampaignAccess(campaignId)
  if (!isMember) return { error: 'Нет доступа к кампании' }
  if (!isDm) return { error: 'Только ГМ может создавать стены' }

  const { data: scene } = await supabase
    .from('scenes')
    .select('id')
    .eq('id', sceneId)
    .eq('campaign_id', campaignId)
    .maybeSingle()
  if (!scene) return { error: 'Сцена не принадлежит кампании' }
  if (!wall || ![wall.x1, wall.y1, wall.x2, wall.y2].every(Number.isFinite)) {
    return { error: 'Некорректные координаты стены' }
  }

  // Валидация: стена должна иметь ненулевую длину
  const dx = wall.x2 - wall.x1
  const dy = wall.y2 - wall.y1
  if (Math.hypot(dx, dy) < 0.1) {
    return { error: 'Стена слишком короткая' }
  }

  const { data, error } = await supabase
    .from('scene_walls')
    .insert({
      scene_id: sceneId,
      campaign_id: campaignId,
      x1: wall.x1,
      y1: wall.y1,
      x2: wall.x2,
      y2: wall.y2,
      color: wall.color ?? '#ef4444',
      created_by: user.id,
    })
    .select('*')
    .single()

  if (error) {
    console.error('createWall error:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    })
    return { error: 'Не удалось создать стену' }
  }

  revalidatePath(`/campaign/${campaignId}/scenes/${sceneId}`)
  return { success: true, wall: data as SceneWall }
}

export async function deleteWall(
  wallId: string,
  sceneId: string,
  campaignId: string
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { isDm, isMember } = await getCampaignAccess(campaignId)
  if (!isMember) return { error: 'Нет доступа к кампании' }
  if (!isDm) return { error: 'Только ГМ может удалять стены' }
  const { data: scene } = await supabase
    .from('scenes')
    .select('id')
    .eq('id', sceneId)
    .eq('campaign_id', campaignId)
    .maybeSingle()
  if (!scene) return { error: 'Сцена не принадлежит кампании' }

  const { data: deleted, error } = await supabase
    .from('scene_walls')
    .delete()
    .eq('id', wallId)
    .eq('scene_id', sceneId)
    .eq('campaign_id', campaignId)
    .select('id')

  if (error || !deleted?.length) {
    console.error('deleteWall error:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    })
    return { error: 'Не удалось удалить стену' }
  }

  revalidatePath(`/campaign/${campaignId}/scenes/${sceneId}`)
  return { success: true }
}

export async function deleteAllWalls(
  sceneId: string,
  campaignId: string
): Promise<{ error: string } | { success: true; count: number }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { isDm, isMember } = await getCampaignAccess(campaignId)
  if (!isMember) return { error: 'Нет доступа к кампании' }
  if (!isDm) return { error: 'Только ГМ может удалять стены' }
  const { data: scene } = await supabase
    .from('scenes')
    .select('id')
    .eq('id', sceneId)
    .eq('campaign_id', campaignId)
    .maybeSingle()
  if (!scene) return { error: 'Сцена не принадлежит кампании' }

  const { data, error } = await supabase
    .from('scene_walls')
    .delete()
    .eq('scene_id', sceneId)
    .eq('campaign_id', campaignId)
    .select('id')

  if (error) {
    console.error('deleteAllWalls error:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    })
    return { error: 'Не удалось удалить стены' }
  }

  revalidatePath(`/campaign/${campaignId}/scenes/${sceneId}`)
  return { success: true, count: data?.length ?? 0 }
}
