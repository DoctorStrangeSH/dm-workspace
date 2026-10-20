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

/** Приводит значение HP из data_json монстра к числу (или null). */
function normalizeMonsterHP(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    // "8d8+3" → берём среднее (4.5 * 8 + 3 = 39), либо первое число
    const avg = value.match(/^(\d+)d(\d+)([+-]\d+)?$/i)
    if (avg) {
      const [, n, d, mod] = avg
      return Math.floor(Number(n) * (Number(d) + 1) / 2) + Number(mod ?? 0)
    }
    const num = Number(value)
    if (Number.isFinite(num)) return num
  }
  return null
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

  const { isDm, isMember } = await getCampaignAccess(campaignId)
  if (!isMember) return { error: 'Нет доступа к кампании' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  // ─── Проверка прав ─────────────────────────────────────────
  // DM может создавать любые токены.
  // Игрок — только токен СВОЕГО персонажа (character_id принадлежит ему).
  if (!isDm) {
    if (!data.characterId) {
      return { error: 'Игрок может добавить только своего персонажа' }
    }
    const { data: char } = await supabase
      .from('characters')
      .select('user_id, campaign_id')
      .eq('id', data.characterId)
      .single()

    if (!char || char.user_id !== user.id || char.campaign_id !== campaignId) {
      return { error: 'Нельзя добавить чужого персонажа' }
    }
  }

  const name = data.name.trim()
  if (!name) return { error: 'Введите имя' }

  // ─── Нормализация HP ───────────────────────────────────────
  let hpCurrent = data.hp_current ?? null
  let hpMax = data.hp_max ?? null

  // Для монстров hp может прийти строкой-формулой ("8d8+3")
  if (typeof hpCurrent === 'string') hpCurrent = normalizeMonsterHP(hpCurrent)
  if (typeof hpMax === 'string') hpMax = normalizeMonsterHP(hpMax)
  if (hpCurrent !== null && typeof hpCurrent !== 'number') hpCurrent = null
  if (hpMax !== null && typeof hpMax !== 'number') hpMax = null

  const { data: token, error } = await supabase
    .from('tokens')
    .insert({
      scene_id: sceneId,
      campaign_id: campaignId,
      name,
      character_id: data.characterId ?? null,
      entity_id: data.entityId ?? null,
      owner_id: isDm ? data.owner_id ?? null : user.id,
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
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  // Проверяем, что пользователь — DM или владелец токена
  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) {
    const { data: token } = await supabase
      .from('tokens')
      .select('owner_id')
      .eq('id', tokenId)
      .single()
    if (!token || token.owner_id !== user.id) {
      return { error: 'Нет прав на перемещение' }
    }
  }

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
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) {
    const { data: token } = await supabase
      .from('tokens')
      .select('owner_id')
      .eq('id', tokenId)
      .single()
    if (!token || token.owner_id !== user.id) {
      return { error: 'Нет прав на изменение HP' }
    }
  }

  const { error } = await supabase
    .from('tokens')
    .update({ hp_current: Math.max(0, hp_current) })
    .eq('id', tokenId)
    .eq('scene_id', sceneId)

  if (error) return { error: `Не удалось обновить HP: ${error.message}` }

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
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) {
    const { data: token } = await supabase
      .from('tokens')
      .select('owner_id')
      .eq('id', tokenId)
      .single()
    if (!token || token.owner_id !== user.id) {
      return { error: 'Нет прав' }
    }
  }

  const { error } = await supabase
    .from('tokens')
    .update({ conditions })
    .eq('id', tokenId)
    .eq('scene_id', sceneId)

  if (error) return { error: 'Не удалось обновить' }
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