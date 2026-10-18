'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCampaignAccess } from '@/lib/queries/access'
import { logEvent } from './logs'

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

export async function rollInitiativeForToken(initiativeEntryId: string, sceneId: string, value: number) {
  const campaignId = await getSceneCampaign(sceneId)
  if (!campaignId) return { error: 'Сцена не найдена' }

  const supabase = await createClient()
  const { error } = await supabase.from('initiative').update({ initiative: value }).eq('id', initiativeEntryId)
  if (error) return { error: 'Не удалось обновить' }

  await recalculateTurnOrder(sceneId)
  revalidatePath(`/campaign/${campaignId}/scenes/${sceneId}`)
  return { success: true }
}

export async function rollAllInitiatives(sceneId: string, tokensWithDex: Array<{ id: string; initiative: number }>) {
  const campaignId = await getSceneCampaign(sceneId)
  if (!campaignId) return { error: 'Сцена не найдена' }

  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Только ГМ' }

  const supabase = await createClient()
  for (const item of tokensWithDex) {
    await supabase.from('initiative').update({ initiative: item.initiative }).eq('id', item.id).eq('scene_id', sceneId)
  }

  await recalculateTurnOrder(sceneId)
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
    const { data: char } = await supabase.from('characters').select('data_json').eq('id', token.character_id).single()
    if (char) {
      const data = char.data_json as any
      data.hp = { ...data.hp, current: newHP }
      await supabase.from('characters').update({ data_json: data }).eq('id', token.character_id)
    }
  }

  revalidatePath(`/campaign/${campaignId}/scenes/${sceneId}`)
  if (token.character_id) revalidatePath(`/campaign/${campaignId}/characters/${token.character_id}`)

  await logEvent(campaignId, 'token_damage', `${token.name}: ${type === 'damage' ? '-' : '+'}${amount} HP`)

  return { success: true, hp: newHP }
}