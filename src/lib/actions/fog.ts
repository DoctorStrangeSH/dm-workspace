'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCampaignAccess } from '@/lib/queries/access'

async function getSceneCampaign(sceneId: string): Promise<string | null> {
  const supabase = await createClient()
  const { data } = await supabase.from('scenes').select('campaign_id').eq('id', sceneId).single()
  return data?.campaign_id ?? null
}

export async function revealArea(
  sceneId: string,
  x: number,
  y: number,
  width: number,
  height: number
) {
  const campaignId = await getSceneCampaign(sceneId)
  if (!campaignId) return { error: 'Сцена не найдена' }

  if (![x, y, width, height].every(Number.isFinite) || x < 0 || y < 0 || width <= 0 || height <= 0 || width > 10000 || height > 10000 || x > 10000 || y > 10000) {
    return { error: 'Некорректные координаты области' }
  }
  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Нет прав' }

  const supabase = await createClient()
  const { error } = await supabase.from('fog_areas').insert({
    scene_id: sceneId,
    campaign_id: campaignId,
    x,
    y,
    width,
    height,
    is_revealed: true,
  })

  if (error) {
    console.error('revealArea error:', error)
    return { error: 'Не удалось открыть' }
  }

  revalidatePath(`/campaign/${campaignId}/scenes/${sceneId}`)
  return { success: true }
}

export async function clearFog(sceneId: string) {
  const campaignId = await getSceneCampaign(sceneId)
  if (!campaignId) return { error: 'Сцена не найдена' }

  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Нет прав' }

  const supabase = await createClient()

  // CHANGES: «Очистить туман» = раскрыть ВСЁ, а не удалить раскрытия.
  // Раньше: delete fog_areas → всё скрыто → туман «возвращался».
  // Теперь: удаляем старые + создаём одну на всю сцену (всё раскрыто).

  // Получаем размеры сцены
  const { data: scene } = await supabase
    .from('scenes')
    .select('width, height')
    .eq('id', sceneId)
    .single()

  if (!scene) return { error: 'Сцена не найдена' }

  // Create the full-scene reveal first. If insertion fails, existing fog data remains intact.
  const { data: fullReveal, error: insError } = await supabase
    .from('fog_areas')
    .insert({
      scene_id: sceneId,
      campaign_id: campaignId,
      x: 0,
      y: 0,
      width: scene.width,
      height: scene.height,
      is_revealed: true,
    })
    .select('id')
    .single()

  if (insError || !fullReveal) {
    console.error('clearFog insert error:', insError)
    return { error: 'Не удалось очистить' }
  }

  // Keep the full-scene reveal while removing older partial reveals. If cleanup fails,
  // the requested state is still achieved because the full-scene reveal remains in place.
  const { error: delError } = await supabase
    .from('fog_areas')
    .delete()
    .eq('scene_id', sceneId)
    .eq('campaign_id', campaignId)
    .neq('id', fullReveal.id)

  if (delError) {
    console.error('clearFog cleanup error:', delError)
  }

  revalidatePath(`/campaign/${campaignId}/scenes/${sceneId}`)
  return { success: true }
}
