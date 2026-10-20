'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCampaignAccess } from '@/lib/queries/access'
import { logEvent } from './logs'
import { abilityModifier } from '@/lib/dnd/formulas'

async function getSceneCampaign(sceneId: string): Promise<string | null> {
  const supabase = await createClient()
  const { data } = await supabase.from('scenes').select('campaign_id').eq('id', sceneId).single()
  return data?.campaign_id ?? null
}

export async function startCombat(sceneId: string) {
  const campaignId = await getSceneCampaign(sceneId)
  if (!campaignId) return { error: 'Сцена не найдена' }

  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Только ГМ может начать бой' }

  const supabase = await createClient()

  const { data: tokens } = await supabase
    .from('tokens')
    .select('id, name, character_id, entity_id')
    .eq('scene_id', sceneId)

  if (!tokens || tokens.length === 0) return { error: 'Нет токенов для инициативы' }

  await supabase.from('initiative').delete().eq('scene_id', sceneId)

  const entries = tokens.map((t) => ({
    scene_id: sceneId,
    campaign_id: campaignId,
    token_id: t.id,
    initiative: 0,
    turn_order: 0,
    is_current: false,
  }))

  const { error } = await supabase.from('initiative').insert(entries)
  if (error) return { error: 'Не удалось начать бой' }

  await logEvent(campaignId, 'combat_start', 'Бой начат')

  revalidatePath(`/campaign/${campaignId}/scenes/${sceneId}`)
  return { success: true }
}

export async function endCombat(sceneId: string) {
  const campaignId = await getSceneCampaign(sceneId)
  if (!campaignId) return { error: 'Сцена не найдена' }

  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Только ГМ' }

  const supabase = await createClient()
  const { error } = await supabase.from('initiative').delete().eq('scene_id', sceneId)
  if (error) return { error: 'Не удалось завершить бой' }

  await logEvent(campaignId, 'combat_end', 'Бой завершён')

  revalidatePath(`/campaign/${campaignId}/scenes/${sceneId}`)
  return { success: true }
}

/**
 * CHANGES:
 * 1. Бросок инициативы теперь происходит НА СЕРВЕРЕ (Math.random() внутри Server Action).
 *    Клиент больше не передаёт `value` — он передаёт только `initiativeEntryId` и `sceneId`.
 * 2. DEX-модификатор берётся из связанного персонажа/монстра:
 *    - tokens.character_id → characters.data_json.abilities.dex
 *    - tokens.entity_id → entities.data_json.abilities.dex
 *    - иначе 0
 * 3. В лог пишется результат броска (для истории сессии).
 * 4. Возвращаем { roll, dexMod, total } — клиент покажет в тосте.
 */
export async function rollInitiativeForToken(
  initiativeEntryId: string,
  sceneId: string
) {
  const campaignId = await getSceneCampaign(sceneId)
  if (!campaignId) return { error: 'Сцена не найдена' }

  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Только ГМ' }

  const supabase = await createClient()

  // Получаем запись инициативы и связанный токен
  const { data: entry } = await supabase
    .from('initiative')
    .select('id, token_id')
    .eq('id', initiativeEntryId)
    .eq('scene_id', sceneId)
    .single()

  if (!entry) return { error: 'Запись инициативы не найдена' }

  const { data: token } = await supabase
    .from('tokens')
    .select('id, name, character_id, entity_id')
    .eq('id', entry.token_id)
    .single()

  if (!token) return { error: 'Токен не найден' }

  // Достаём DEX
  let dex = 10
  if (token.character_id) {
    const { data: char } = await supabase
      .from('characters')
      .select('data_json')
      .eq('id', token.character_id)
      .single()
    const dj = char?.data_json as { abilities?: { dex?: number } } | undefined
    if (dj?.abilities?.dex !== undefined) dex = dj.abilities.dex
  } else if (token.entity_id) {
    const { data: entity } = await supabase
      .from('entities')
      .select('data_json')
      .eq('id', token.entity_id)
      .single()
    const dj = entity?.data_json as { abilities?: { dex?: number } } | undefined
    if (dj?.abilities?.dex !== undefined) dex = dj.abilities.dex
  }

  const dexMod = abilityModifier(dex)
  const roll = Math.floor(Math.random() * 20) + 1
  const total = roll + dexMod

  const { error } = await supabase
    .from('initiative')
    .update({ initiative: total })
    .eq('id', initiativeEntryId)
    .eq('scene_id', sceneId)

  if (error) return { error: 'Не удалось обновить инициативу' }

  await recalculateTurnOrder(sceneId)
  await logEvent(
    campaignId,
    'initiative_roll',
    `${token.name}: инициатива ${total} (1d20=${roll}, DEX ${dexMod >= 0 ? '+' : ''}${dexMod})`
  )

  revalidatePath(`/campaign/${campaignId}/scenes/${sceneId}`)
  return { success: true, roll, dexMod, total }
}

export async function rollAllInitiatives(sceneId: string) {
  const campaignId = await getSceneCampaign(sceneId)
  if (!campaignId) return { error: 'Сцена не найдена' }

  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Только ГМ' }

  const supabase = await createClient()
  const { data: entries } = await supabase
    .from('initiative')
    .select('id')
    .eq('scene_id', sceneId)

  if (!entries) return { error: 'Нет инициативы' }

  for (const entry of entries) {
    await rollInitiativeForToken(entry.id, sceneId)
  }

  revalidatePath(`/campaign/${campaignId}/scenes/${sceneId}`)
  return { success: true }
}

async function recalculateTurnOrder(sceneId: string) {
  const supabase = await createClient()
  const { data: entries } = await supabase
    .from('initiative')
    .select('id, initiative')
    .eq('scene_id', sceneId)
    .order('initiative', { ascending: false })

  if (!entries) return
  for (let i = 0; i < entries.length; i++) {
    await supabase.from('initiative').update({ turn_order: i, is_current: i === 0 }).eq('id', entries[i].id)
  }
}

export async function nextTurn(sceneId: string) {
  const campaignId = await getSceneCampaign(sceneId)
  if (!campaignId) return { error: 'Сцена не найдена' }

  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Только ГМ' }

  const supabase = await createClient()
  const { data: entries } = await supabase
    .from('initiative')
    .select('id, turn_order')
    .eq('scene_id', sceneId)
    .order('turn_order')

  if (!entries || entries.length === 0) return { error: 'Нет инициативы' }

  const { data: currentEntry } = await supabase
    .from('initiative')
    .select('id, turn_order')
    .eq('scene_id', sceneId)
    .eq('is_current', true)
    .maybeSingle()

  if (!currentEntry) {
    await supabase.from('initiative').update({ is_current: true }).eq('id', entries[0].id)
    revalidatePath(`/campaign/${campaignId}/scenes/${sceneId}`)
    return { success: true }
  }

  const nextIndex = (currentEntry.turn_order + 1) % entries.length
  await supabase.from('initiative').update({ is_current: false }).eq('id', currentEntry.id)

  const nextEntry = entries.find((e) => e.turn_order === nextIndex)
  if (nextEntry) await supabase.from('initiative').update({ is_current: true }).eq('id', nextEntry.id)

  revalidatePath(`/campaign/${campaignId}/scenes/${sceneId}`)
  return { success: true }
}

/**
 * CHANGES:
 * 1. Убран `any` — `data_json` типизирован как `{ hp?: { current?: number } }`.
 * 2. Логика не изменилась.
 */
export async function damageToken(tokenId: string, sceneId: string, amount: number, type: 'damage' | 'heal' | 'set') {
  const campaignId = await getSceneCampaign(sceneId)
  if (!campaignId) return { error: 'Сцена не найдена' }

  const supabase = await createClient()
  const { data: token } = await supabase
    .from('tokens')
    .select('hp_current, hp_max, character_id, name')
    .eq('id', tokenId)
    .single()

  if (!token || token.hp_current === null || token.hp_max === null) return { error: 'У токена нет HP' }

  let newHP = token.hp_current
  if (type === 'damage') newHP = Math.max(0, token.hp_current - amount)
  else if (type === 'heal') newHP = Math.min(token.hp_max, token.hp_current + amount)
  else if (type === 'set') newHP = Math.max(0, Math.min(token.hp_max, amount))

  const { error } = await supabase.from('tokens').update({ hp_current: newHP }).eq('id', tokenId)
  if (error) return { error: 'Не удалось обновить' }

  if (token.character_id) {
    const { data: char } = await supabase
      .from('characters')
      .select('data_json')
      .eq('id', token.character_id)
      .single()
    if (char) {
      const data = char.data_json as { hp?: { current?: number; max?: number; temp?: number } }
      data.hp = { ...data.hp, current: newHP }
      await supabase.from('characters').update({ data_json: data }).eq('id', token.character_id)
    }
  }

  revalidatePath(`/campaign/${campaignId}/scenes/${sceneId}`)
  if (token.character_id) revalidatePath(`/campaign/${campaignId}/characters/${token.character_id}`)

  await logEvent(campaignId, 'token_damage', `${token.name}: ${type === 'damage' ? '-' : '+'}${amount} HP`)

  return { success: true, hp: newHP }
}