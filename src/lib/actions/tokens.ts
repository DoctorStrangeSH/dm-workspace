'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCampaignAccess } from '@/lib/queries/access'
import type { TokenCondition } from '@/lib/types'

async function getSceneCampaign(sceneId: string): Promise<string | null> {
  const supabase = await createClient()
  const { data } = await supabase.from('scenes').select('campaign_id').eq('id', sceneId).single()
  return data?.campaign_id ?? null
}

function normalizeMonsterHP(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const avg = value.match(/^(\d+)d(\d+)([+-]\d+)?$/i)
    if (avg) {
      const [, n, d, mod] = avg
      return Math.floor((Number(n) * (Number(d) + 1)) / 2) + Number(mod ?? 0)
    }
    const num = Number(value)
    if (Number.isFinite(num)) return num
  }
  return null
}

/** CHANGES: проверка owner_id ИЛИ token_owners */
async function canEditToken(
  tokenId: string,
  sceneId: string,
  campaignId: string,
  userId: string,
  isDm: boolean
): Promise<boolean> {
  const supabase = await createClient()
  const { data: token } = await supabase
    .from('tokens')
    .select('owner_id')
    .eq('id', tokenId)
    .eq('scene_id', sceneId)
    .eq('campaign_id', campaignId)
    .maybeSingle()
  if (!token) return false
  if (isDm) return true
  if (token.owner_id === userId) return true

  const { data: owner } = await supabase
    .from('token_owners')
    .select('user_id')
    .eq('token_id', tokenId)
    .eq('user_id', userId)
    .maybeSingle()

  return !!owner
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
): Promise<{ error: string } | { success: true; tokenId: string }> {
  const campaignId = await getSceneCampaign(sceneId)
  if (!campaignId) return { error: 'Сцена не найдена' }

  const { isDm, isMember } = await getCampaignAccess(campaignId)
  if (!isMember) return { error: 'Нет доступа к кампании' }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { error: 'Некорректные данные токена' }
  }
  if (typeof data.name !== 'string') return { error: 'Введите имя' }
  if (!Number.isFinite(data.x) || !Number.isFinite(data.y)) {
    return { error: 'Некорректные координаты токена' }
  }
  if (data.size !== undefined && (!Number.isFinite(data.size) || data.size < 0.25 || data.size > 10)) {
    return { error: 'Размер токена должен быть от 0.25 до 10' }
  }
  if (data.hp_current !== undefined && data.hp_current !== null && typeof data.hp_current !== 'number' && typeof data.hp_current !== 'string') {
    return { error: 'Некорректное текущее HP' }
  }
  if (data.hp_max !== undefined && data.hp_max !== null && typeof data.hp_max !== 'number' && typeof data.hp_max !== 'string') {
    return { error: 'Некорректное максимальное HP' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  if (!isDm && !data.characterId) {
    return { error: 'Игрок может добавить только своего персонажа' }
  }

  // Never allow a token in this campaign to reference a character or monster
  // from another campaign, even when the action is called directly.
  if (data.characterId) {
    const { data: char } = await supabase
      .from('characters')
      .select('user_id, campaign_id')
      .eq('id', data.characterId)
      .maybeSingle()
    if (!char || char.campaign_id !== campaignId) {
      return { error: 'Персонаж не найден в этой кампании' }
    }
    if (!isDm && char.user_id !== user.id) {
      return { error: 'Нельзя добавить чужого персонажа' }
    }
  }

  if (data.entityId) {
    const { data: entity } = await supabase
      .from('entities')
      .select('id')
      .eq('id', data.entityId)
      .eq('campaign_id', campaignId)
      .maybeSingle()
    if (!entity) return { error: 'Существо не найдено в этой кампании' }
  }

  if (data.image_url !== undefined) {
    if (typeof data.image_url !== 'string' || data.image_url.length > 2048) {
      return { error: 'Некорректная ссылка на изображение' }
    }
    try {
      const imageUrl = new URL(data.image_url)
      if (imageUrl.protocol !== 'https:' && imageUrl.protocol !== 'http:') {
        return { error: 'Некорректная ссылка на изображение' }
      }
    } catch {
      return { error: 'Некорректная ссылка на изображение' }
    }
  }
  if (data.color !== undefined && (typeof data.color !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(data.color))) {
    return { error: 'Некорректный цвет токена' }
  }
  if (data.owner_id !== undefined && data.owner_id !== null && typeof data.owner_id !== 'string') {
    return { error: 'Некорректный владелец токена' }
  }

  const name = data.name.trim()
  if (!name) return { error: 'Введите имя' }
  if (name.length > 150) return { error: 'Имя слишком длинное' }

  let hpCurrent = data.hp_current ?? null
  let hpMax = data.hp_max ?? null
  if (typeof hpCurrent === 'string') hpCurrent = normalizeMonsterHP(hpCurrent)
  if (typeof hpMax === 'string') hpMax = normalizeMonsterHP(hpMax)
  if (hpCurrent !== null && (typeof hpCurrent !== 'number' || !Number.isFinite(hpCurrent))) hpCurrent = null
  if (hpMax !== null && (typeof hpMax !== 'number' || !Number.isFinite(hpMax))) hpMax = null

  const { data: token, error } = await supabase
    .from('tokens')
    .insert({
      scene_id: sceneId,
      campaign_id: campaignId,
      name,
      character_id: data.characterId ?? null,
      entity_id: data.entityId ?? null,
      owner_id: isDm ? (data.owner_id ?? null) : user.id,
      x: data.x,
      y: data.y,
      size: data.size ?? 1,
      hp_current: hpCurrent,
      hp_max: hpMax,
      image_url: data.image_url ?? null,
      color: data.color ?? '#6366f1',
    })
    .select('id')
    .single()

  if (error) {
    console.error('createToken error:', error)
    return { error: `Не удалось создать: ${error.message}` }
  }

  // CHANGES: проверка, что token не null (Supabase .single() → data: T | null).
  // Иначе TS выводит tokenId: string | undefined.
  if (!token) {
    return { error: 'Не удалось создать токен' }
  }

  revalidatePath(`/campaign/${campaignId}/scenes/${sceneId}`)
  return { success: true, tokenId: token.id }
}

export async function moveToken(tokenId: string, sceneId: string, x: number, y: number) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return { error: 'Некорректные координаты' }
  const campaignId = await getSceneCampaign(sceneId)
  if (!campaignId) return { error: 'Сцена не найдена' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { isDm, isMember } = await getCampaignAccess(campaignId)
  if (!isMember) return { error: 'Нет доступа к кампании' }
  const canEdit = await canEditToken(tokenId, sceneId, campaignId, user.id, isDm)
  if (!canEdit) return { error: 'Нет прав на перемещение' }

  const { data, error } = await supabase
    .from('tokens')
    .update({ x, y })
    .eq('id', tokenId)
    .eq('scene_id', sceneId)
    .eq('campaign_id', campaignId)
    .select('id')
    .maybeSingle()

  if (error || !data) return { error: 'Не удалось переместить' }
  return { success: true }
}

export async function updateTokenHP(tokenId: string, sceneId: string, hp_current: number) {
  if (!Number.isSafeInteger(hp_current) || hp_current < 0 || hp_current > 1_000_000) {
    return { error: 'Некорректное значение HP' }
  }

  // Route absolute HP changes through the shared combat action so its
  // authorization checks and linked-character synchronization are applied.
  // This is not yet a database transaction; damageToken's multi-row write
  // remains a known rollout blocker until the atomic RPC is safely deployed.
  return damageToken(tokenId, sceneId, hp_current, 'set')
}

export async function updateTokenConditions(
  tokenId: string,
  sceneId: string,
  conditions: TokenCondition[]
) {
  const campaignId = await getSceneCampaign(sceneId)
  if (!campaignId) return { error: 'Сцена не найдена' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { isDm, isMember } = await getCampaignAccess(campaignId)
  if (!isMember) return { error: 'Нет доступа к кампании' }
  const canEdit = await canEditToken(tokenId, sceneId, campaignId, user.id, isDm)
  if (!canEdit) return { error: 'Нет прав' }

  if (!Array.isArray(conditions) || conditions.length > 50) {
    return { error: 'Некорректный список состояний' }
  }

  const { data, error } = await supabase
    .from('tokens')
    .update({ conditions })
    .eq('id', tokenId)
    .eq('scene_id', sceneId)
    .eq('campaign_id', campaignId)
    .select('id')
    .maybeSingle()

  if (error || !data) return { error: 'Не удалось обновить' }
  revalidatePath(`/campaign/${campaignId}/scenes/${sceneId}`)
  return { success: true }
}

export async function toggleTokenVisibility(tokenId: string, sceneId: string) {
  const campaignId = await getSceneCampaign(sceneId)
  if (!campaignId) return { error: 'Сцена не найдена' }
  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Нет прав' }

  const supabase = await createClient()
  const { data: token } = await supabase
    .from('tokens')
    .select('is_hidden')
    .eq('id', tokenId)
    .eq('scene_id', sceneId)
    .maybeSingle()
  if (!token) return { error: 'Токен не найден' }

  const { data, error } = await supabase
    .from('tokens')
    .update({ is_hidden: !token.is_hidden })
    .eq('id', tokenId)
    .eq('scene_id', sceneId)
    .select('id')
    .maybeSingle()

  if (error || !data) return { error: 'Не удалось' }
  revalidatePath(`/campaign/${campaignId}/scenes/${sceneId}`)
  return { success: true }
}

export async function deleteToken(tokenId: string, sceneId: string) {
  const campaignId = await getSceneCampaign(sceneId)
  if (!campaignId) return { error: 'Сцена не найдена' }
  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Нет прав' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tokens')
    .delete()
    .eq('id', tokenId)
    .eq('scene_id', sceneId)
    .select('id')
    .maybeSingle()
  if (error || !data) return { error: 'Не удалось удалить' }
  revalidatePath(`/campaign/${campaignId}/scenes/${sceneId}`)
  return { success: true }
}
