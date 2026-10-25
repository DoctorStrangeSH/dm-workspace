'use server'

import { createClient } from '@/lib/supabase/server'
import { getCampaignAccess } from '@/lib/queries/access'
import { revalidatePath } from 'next/cache'
import { createToken } from '@/lib/actions/tokens'
import type { SummonRequest } from '@/lib/types'

export async function createSummonRequest(
  campaignId: string,
  sceneId: string,
  data: { monsterName: string; monsterEntityId: string | null; monsterCount: number }
): Promise<{ error: string } | { success: true; request: SummonRequest }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { isMember } = await getCampaignAccess(campaignId)
  if (!isMember) return { error: 'Нет доступа к кампании' }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { error: 'Некорректные данные призыва' }
  }
  if (typeof data.monsterName !== 'string' || !data.monsterName.trim()) {
    return { error: 'Укажите имя монстра' }
  }
  if (data.monsterName.trim().length > 150) return { error: 'Имя монстра слишком длинное' }
  if (!Number.isInteger(data.monsterCount) || data.monsterCount < 1 || data.monsterCount > 20) {
    return { error: 'Количество монстров должно быть от 1 до 20' }
  }
  if (data.monsterEntityId !== null && typeof data.monsterEntityId !== 'string') {
    return { error: 'Некорректное существо' }
  }

  const { data: scene } = await supabase
    .from('scenes')
    .select('id')
    .eq('id', sceneId)
    .eq('campaign_id', campaignId)
    .maybeSingle()
  if (!scene) return { error: 'Сцена не принадлежит кампании' }

  if (data.monsterEntityId) {
    const { data: entity } = await supabase
      .from('entities')
      .select('id')
      .eq('id', data.monsterEntityId)
      .eq('campaign_id', campaignId)
      .maybeSingle()
    if (!entity) return { error: 'Существо не найдено в этой кампании' }
  }

  const count = data.monsterCount
  const name = data.monsterName.trim()

  const { data: created, error } = await supabase
    .from('summon_requests')
    .insert({
      campaign_id: campaignId,
      scene_id: sceneId,
      requester_id: user.id,
      monster_name: name,
      monster_entity_id: data.monsterEntityId,
      monster_count: count,
      status: 'pending',
    })
    .select('*')
    .single()

  if (error) {
    console.error('createSummonRequest error:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    })
    return { error: 'Не удалось создать запрос' }
  }

  revalidatePath(`/campaign/${campaignId}/scenes/${sceneId}`)
  return { success: true, request: created as SummonRequest }
}

export async function approveSummonRequest(
  requestId: string,
  sceneId: string,
  campaignId: string
): Promise<{ error: string } | { success: true; tokenId: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Только ГМ может подтверждать призыв' }

  const { data: request, error: fetchError } = await supabase
    .from('summon_requests')
    .select('*')
    .eq('id', requestId)
    .eq('campaign_id', campaignId)
    .single()

  if (fetchError || !request) return { error: 'Запрос не найден' }
  if (request.scene_id !== sceneId) return { error: 'Запрос относится к другой сцене' }
  if (request.status !== 'pending') return { error: 'Запрос уже обработан' }

  const { data: scene } = await supabase
    .from('scenes')
    .select('width, height')
    .eq('id', sceneId)
    .eq('campaign_id', campaignId)
    .maybeSingle()

  if (!scene) return { error: 'Сцена не принадлежит кампании' }

  const centerX = Math.floor(scene.width / 2)
  const centerY = Math.floor(scene.height / 2)
  const createdTokenIds: string[] = []

  for (let i = 0; i < request.monster_count; i++) {
    const offset = i * 1
    const res = await createToken(sceneId, {
      name: `${request.monster_name}${request.monster_count > 1 ? ` ${i + 1}` : ''}`,
      x: centerX + offset,
      y: centerY,
      entityId: request.monster_entity_id ?? undefined,
    })
    if ('error' in res) {
      return { error: res.error }
    }
    createdTokenIds.push(res.tokenId)
  }

  const { data: updatedRequest, error: updateError } = await supabase
    .from('summon_requests')
    .update({
      status: 'approved',
      resolved_by: user.id,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .eq('campaign_id', campaignId)
    .eq('scene_id', sceneId)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle()

  if (updateError || !updatedRequest) {
    console.error('approveSummonRequest error:', {
      code: updateError.code,
      message: updateError.message,
      details: updateError.details,
      hint: updateError.hint,
    })
    return { error: 'Не удалось подтвердить запрос' }
  }

  // CHANGES: защита от пустого массива (TS: string | undefined → string).
  const firstTokenId = createdTokenIds[0]
  if (!firstTokenId) {
    return { error: 'Не удалось создать токены' }
  }

  revalidatePath(`/campaign/${campaignId}/scenes/${sceneId}`)
  return { success: true, tokenId: firstTokenId }
}

export async function rejectSummonRequest(
  requestId: string,
  campaignId: string
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Только ГМ может отклонять призыв' }

  const { data: updated, error } = await supabase
    .from('summon_requests')
    .update({
      status: 'rejected',
      resolved_by: user.id,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .eq('campaign_id', campaignId)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle()

  if (error || !updated) {
    console.error('rejectSummonRequest error:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    })
    return { error: 'Не удалось отклонить запрос' }
  }

  revalidatePath(`/campaign/${campaignId}`)
  return { success: true }
}
