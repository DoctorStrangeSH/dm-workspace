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

  // Удаляем старые раскрытия
  const { error: delError } = await supabase.from('fog_areas').delete().eq('scene_id', sceneId).eq('campaign_id', campaignId)

  if (delError) return { error: 'Не удалось очистить' }

  // Создаём одну область — вся сцена раскрыта
  const { error: insError } = await supabase.from('fog_areas').insert({
    scene_id: sceneId,
    campaign_id: campaignId,
    x: 0,
    y: 0,
    width: scene.width,
    height: scene.height,
    is_revealed: true,
  })

  if (insError) {
    console.error('clearFog insert error:', insError)
    return { error: 'Не удалось очистить' }
  }

  revalidatePath(`/campaign/${campaignId}/scenes/${sceneId}`)
  return { success: true }
}
