'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCampaignAccess } from '@/lib/queries/access'
import type { TokenCondition } from '@/lib/types'

async function getSceneCampaign(sceneId: string): Promise<string | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('scenes')
    .select('campaign_id')
    .eq('id', sceneId)
    .single()
  return data?.campaign_id ?? null
}

export async function createToken(
  sceneId: string,
  data: {
    name: string
    characterId?: string
    entityId?: string
    x: number
    y: number
    size?: number
    hp_current?: number
    hp_max?: number
    image_url?: string
    color?: string
    owner_id?: string
  }
) {
  const campaignId = await getSceneCampaign(sceneId)
  if (!campaignId) return { error: 'Сцена не найдена' }

  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Только ГМ может создавать токены' }

  const name = data.name.trim()
  if (!name) return { error: 'Введите имя' }

  const supabase = await createClient()
  const { data: token, error } = await supabase
    .from('tokens')
    .insert({
      scene_id: sceneId,
      campaign_id: campaignId,
      name,
      character_id: data.characterId ?? null,
      entity_id: data.entityId ?? null,
      owner_id: data.owner_id ?? null,
      x: data.x,
      y: data.y,
      size: data.size ?? 1,
      hp_current: data.hp_current ?? null,
      hp_max: data.hp_max ?? null,
      image_url: data.image_url ?? null,
      color: data.color ?? '#6366f1',
    })
    .select('id')
    .single()

  if (error) {
    console.error('createToken error:', error)
    return { error: 'Не удалось создать' }
  }

  revalidatePath(`/campaign/${campaignId}/scenes/${sceneId}`)
  return { success: true, tokenId: token.id }
}

export async function moveToken(
  tokenId: string,
  sceneId: string,
  x: number,
  y: number
) {
  const campaignId = await getSceneCampaign(sceneId)
  if (!campaignId) return { error: 'Сцена не найдена' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('tokens')
    .update({ x, y })
    .eq('id', tokenId)
    .eq('scene_id', sceneId)

  if (error) return { error: 'Не удалось переместить' }

  return { success: true }
}

export async function updateTokenHP(
  tokenId: string,
  sceneId: string,
  hp_current: number
) {
  const campaignId = await getSceneCampaign(sceneId)
  if (!campaignId) return { error: 'Сцена не найдена' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('tokens')
    .update({ hp_current: Math.max(0, hp_current) })
    .eq('id', tokenId)
    .eq('scene_id', sceneId)

  if (error) return { error: 'Не удалось обновить HP' }

  revalidatePath(`/campaign/${campaignId}/scenes/${sceneId}`)
  return { success: true }
}

export async function updateTokenConditions(
  tokenId: string,
  sceneId: string,
  conditions: TokenCondition[]
) {
  const campaignId = await getSceneCampaign(sceneId)
  if (!campaignId) return { error: 'Сцена не найдена' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('tokens')
    .update({ conditions })
    .eq('id', tokenId)
    .eq('scene_id', sceneId)

  if (error) return { error: 'Не удалось обновить' }

  revalidatePath(`/campaign/${campaignId}/scenes/${sceneId}`)
  return { success: true }
}

export async function toggleTokenVisibility(
  tokenId: string,
  sceneId: string
) {
  const campaignId = await getSceneCampaign(sceneId)
  if (!campaignId) return { error: 'Сцена не найдена' }

  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Нет прав' }

  const supabase = await createClient()
  const { data: token } = await supabase
    .from('tokens')
    .select('is_hidden')
    .eq('id', tokenId)
    .single()

  if (!token) return { error: 'Токен не найден' }

  const { error } = await supabase
    .from('tokens')
    .update({ is_hidden: !token.is_hidden })
    .eq('id', tokenId)

  if (error) return { error: 'Не удалось' }

  revalidatePath(`/campaign/${campaignId}/scenes/${sceneId}`)
  return { success: true }
}

export async function deleteToken(tokenId: string, sceneId: string) {
  const campaignId = await getSceneCampaign(sceneId)
  if (!campaignId) return { error: 'Сцена не найдена' }

  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Нет прав' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('tokens')
    .delete()
    .eq('id', tokenId)
    .eq('scene_id', sceneId)

  if (error) return { error: 'Не удалось удалить' }

  revalidatePath(`/campaign/${campaignId}/scenes/${sceneId}`)
  return { success: true }
}