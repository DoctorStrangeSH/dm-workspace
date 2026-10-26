'use server'

import { createClient } from '@/lib/supabase/server'
import { validCharacterHP } from '@/lib/dnd/valid-character-hp'
import { revalidatePath } from 'next/cache'
import { getCampaignAccess } from '@/lib/queries/access'
import { logEvent } from './logs'
import { abilityModifier } from '@/lib/dnd/formulas'
import { getEquipmentBonuses } from '@/lib/dnd/equipment-bonuses'
import type { CharacterInventoryItem } from '@/lib/types'

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

  const { error: clearError } = await supabase.from('initiative').delete().eq('scene_id', sceneId)
  if (clearError) return { error: 'Не удалось подготовить инициативу' }

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
export async function rollInitiativeForToken(initiativeEntryId: string, sceneId: string) {
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
  let equipmentInitiative = 0
  if (token.character_id) {
    const { data: char } = await supabase
      .from('characters')
      .select('data_json')
      .eq('id', token.character_id)
      .eq('campaign_id', campaignId)
      .single()
    const dj = char?.data_json as { abilities?: { dex?: number }; inventory?: CharacterInventoryItem[] } | undefined
    if (typeof dj?.abilities?.dex === 'number' && Number.isFinite(dj.abilities.dex)) dex = dj.abilities.dex
    equipmentInitiative = getEquipmentBonuses(dj?.inventory).initiative
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
  const total = roll + dexMod + equipmentInitiative

  const { data: updatedEntry, error } = await supabase
    .from('initiative')
    .update({ initiative: total })
    .eq('id', initiativeEntryId)
    .eq('scene_id', sceneId)
    .select('id')
    .maybeSingle()

  if (error || !updatedEntry) return { error: 'Не удалось обновить инициативу' }

  const orderUpdated = await recalculateTurnOrder(sceneId)
  if (!orderUpdated) return { error: 'Инициатива обновлена, но не удалось пересчитать порядок ходов' }
  await logEvent(
    campaignId,
    'initiative_roll',
    `${token.name}: инициатива ${total} (1d20=${roll}, DEX ${dexMod >= 0 ? '+' : ''}${dexMod}, экипировка ${equipmentInitiative >= 0 ? '+' : ''}${equipmentInitiative})`
  )

  revalidatePath(`/campaign/${campaignId}/scenes/${sceneId}`)
  return { success: true, roll, dexMod, equipmentInitiative, total }
}

export async function rollAllInitiatives(sceneId: string) {
  const campaignId = await getSceneCampaign(sceneId)
  if (!campaignId) return { error: 'Сцена не найдена' }

  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Только ГМ' }

  const supabase = await createClient()
  const { data: entries } = await supabase.from('initiative').select('id').eq('scene_id', sceneId)

  if (!entries || entries.length === 0) return { error: 'Нет инициативы' }

  const results = []
  for (const entry of entries) {
    results.push(await rollInitiativeForToken(entry.id, sceneId))
  }

  const failedRolls = results.filter((result) => !('success' in result && result.success))
  if (failedRolls.length > 0) {
    revalidatePath(`/campaign/${campaignId}/scenes/${sceneId}`)
    return { error: `Не удалось выполнить бросок инициативы для ${failedRolls.length} из ${entries.length} участников` }
  }

  revalidatePath(`/campaign/${campaignId}/scenes/${sceneId}`)
  return { success: true }
}

async function recalculateTurnOrder(sceneId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data: entries, error: fetchError } = await supabase
    .from('initiative')
    .select('id, initiative')
    .eq('scene_id', sceneId)
    .order('initiative', { ascending: false })

  if (fetchError || !entries || entries.length === 0) return false
  for (let i = 0; i < entries.length; i++) {
    const { data: updated, error } = await supabase
      .from('initiative')
      .update({ turn_order: i, is_current: i === 0 })
      .eq('id', entries[i].id)
      .eq('scene_id', sceneId)
      .select('id')
      .maybeSingle()
    if (error || !updated) return false
  }
  return true
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
    const { data: activated, error } = await supabase
      .from('initiative')
      .update({ is_current: true })
      .eq('id', entries[0].id)
      .eq('scene_id', sceneId)
      .select('id')
      .maybeSingle()
    if (error || !activated) return { error: 'Не удалось установить текущий ход' }

    revalidatePath(`/campaign/${campaignId}/scenes/${sceneId}`)
    return { success: true }
  }

  const nextIndex = (currentEntry.turn_order + 1) % entries.length
  const nextEntry = entries.find((e) => e.turn_order === nextIndex)
  if (!nextEntry) return { error: 'Не удалось определить следующий ход' }

  const { data: cleared, error: clearError } = await supabase
    .from('initiative')
    .update({ is_current: false })
    .eq('id', currentEntry.id)
    .eq('scene_id', sceneId)
    .select('id')
    .maybeSingle()
  if (clearError || !cleared) return { error: 'Не удалось завершить текущий ход' }

  const { data: activated, error: activateError } = await supabase
    .from('initiative')
    .update({ is_current: true })
    .eq('id', nextEntry.id)
    .eq('scene_id', sceneId)
    .select('id')
    .maybeSingle()

  if (activateError || !activated) {
    // Best-effort recovery so a failed transition does not leave combat without a current turn.
    await supabase
      .from('initiative')
      .update({ is_current: true })
      .eq('id', currentEntry.id)
      .eq('scene_id', sceneId)
    return { error: 'Не удалось перейти к следующему ходу' }
  }

  revalidatePath(`/campaign/${campaignId}/scenes/${sceneId}`)
  return { success: true }
}

/**
 * CHANGES:
 * 1. Убран `any` — `data_json` типизирован как `{ hp?: { current?: number } }`.
 * 2. Логика не изменилась.
 */
export async function damageToken(
  tokenId: string,
  sceneId: string,
  amount: number,
  type: 'damage' | 'heal' | 'set'
) {
  if (!Number.isFinite(amount) || amount < 0) return { error: 'Некорректное значение HP' }
  if (type !== 'damage' && type !== 'heal' && type !== 'set') {
    return { error: 'Неизвестный тип изменения HP' }
  }

  const campaignId = await getSceneCampaign(sceneId)
  if (!campaignId) return { error: 'Сцена не найдена' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { isDm, isMember } = await getCampaignAccess(campaignId)
  if (!isMember) return { error: 'Нет доступа к кампании' }

  const { data: token } = await supabase
    .from('tokens')
    .select('id, owner_id, hp_current, hp_max, character_id, name')
    .eq('id', tokenId)
    .eq('scene_id', sceneId)
    .eq('campaign_id', campaignId)
    .maybeSingle()

  if (!token) return { error: 'Токен не найден в этой сцене' }
  if (token.hp_current === null || token.hp_max === null) {
    return { error: 'У токена нет HP' }
  }

  if (!isDm && token.owner_id !== user.id) {
    const { data: owner } = await supabase
      .from('token_owners')
      .select('user_id')
      .eq('token_id', tokenId)
      .eq('user_id', user.id)
      .maybeSingle()
    if (!owner) return { error: 'Нет прав на изменение HP' }
  }

  if (
    !Number.isSafeInteger(amount) ||
    !Number.isSafeInteger(token.hp_current) ||
    !Number.isSafeInteger(token.hp_max) ||
    token.hp_max <= 0 ||
    token.hp_current < 0 ||
    token.hp_current > token.hp_max
  ) {
    return { error: 'Некорректные исходные HP токена' }
  }

  // Refuse to mutate the token when its linked character already has corrupt HP.
  // The read is still repeated below before synchronizing, to avoid writing stale data.
  if (token.character_id) {
    const { data: linked, error: linkedError } = await supabase
      .from('characters')
      .select('data_json')
      .eq('id', token.character_id)
      .eq('campaign_id', campaignId)
      .maybeSingle()
    if (linkedError || !linked || !validCharacterHP(linked.data_json?.hp)) {
      return { error: 'HP связанного персонажа некорректны; изменение токена отменено' }
    }
  }

  // Disabled by default. Enable only after the reviewed RPC has been deployed and
  // authorized on DEV, and after ALL character HP writers have been coordinated.
  if (process.env.ATOMIC_TOKEN_HP_RPC_ENABLED === 'true') {
    // Fail closed unless connected to the explicitly confirmed DEV Supabase project.
    // NODE_ENV is normally 'production' for preview deployments, so it is not
    // a reliable way to distinguish DEV from production databases.
    const devSupabaseUrl = 'https://yoondivyeueyrtgeldja.supabase.co'
    if (
      process.env.VERCEL_ENV === 'production' ||
      process.env.NEXT_PUBLIC_SUPABASE_URL !== devSupabaseUrl ||
      process.env.ATOMIC_TOKEN_HP_DEV_CONFIRMED !== 'true'
    ) {
      return { error: 'Атомарный HP не активирован для этого окружения' }
    }
    const { data: hp, error: rpcError } = await supabase.rpc('apply_token_hp_atomic', {
      p_token_id: tokenId,
      p_scene_id: sceneId,
      p_amount: amount,
      p_mode: type,
      p_expected_hp: type === 'set' ? token.hp_current : null,
    })
    if (rpcError || typeof hp !== 'number') {
      return { error: 'Атомарное изменение HP не удалось. Проверьте доступ и обновите сцену.' }
    }
    revalidatePath(`/campaign/${campaignId}/scenes/${sceneId}`)
    if (token.character_id) revalidatePath(`/campaign/${campaignId}/characters/${token.character_id}`)
    await logEvent(campaignId, 'token_damage',
      `${token.name}: ${type === 'damage' ? '-' : type === 'heal' ? '+' : ''}${amount} HP`)
    return { success: true, hp }
  }

  let newHP = token.hp_current
  if (type === 'damage') newHP = Math.max(0, token.hp_current - amount)
  else if (type === 'heal') newHP = Math.min(token.hp_max, token.hp_current + amount)
  else newHP = Math.max(0, Math.min(token.hp_max, amount))

  const { data: updatedToken, error } = await supabase
    .from('tokens')
    .update({ hp_current: newHP })
    .eq('id', tokenId)
    .eq('scene_id', sceneId)
    .eq('campaign_id', campaignId)
    .eq('hp_current', token.hp_current)
    .select('id')
    .maybeSingle()
  if (error) return { error: 'Не удалось обновить HP' }
  if (!updatedToken) return { error: 'HP токена уже изменились другим участником. Обновите данные и повторите действие.' }

  if (token.character_id) {
    const { data: char, error: characterFetchError } = await supabase
      .from('characters')
      .select('data_json')
      .eq('id', token.character_id)
      .eq('campaign_id', campaignId)
      .maybeSingle()

    if (characterFetchError || !char) {
      // Best-effort rollback: avoid leaving token HP changed when its linked character cannot be synchronized.
      const { data: rolledBack, error: rollbackError } = await supabase
        .from('tokens')
        .update({ hp_current: token.hp_current })
        .eq('id', tokenId)
        .eq('scene_id', sceneId)
        .eq('campaign_id', campaignId)
        .eq('hp_current', newHP)
        .select('id')
        .maybeSingle()
      if (rollbackError || !rolledBack) {
        return { error: 'HP токена обновлено, но персонаж не найден; не удалось автоматически восстановить прежнее HP токена' }
      }
      return { error: 'Не удалось загрузить связанного персонажа; изменение HP отменено' }
    }

    const previous = char.data_json
    // Never mutate the snapshot used for optimistic JSONB comparison.
    const data: { hp?: { current?: number; max?: number; temp?: number } } =
      previous && typeof previous === 'object' && !Array.isArray(previous)
        ? structuredClone(previous as { hp?: { current?: number; max?: number; temp?: number } })
        : {}
    const characterHP = validCharacterHP(data.hp)
    if (!characterHP || newHP > characterHP.max) {
      // Preserve both records when the character's HP changed or disagrees with the token.
      const { data: rolledBack, error: rollbackError } = await supabase
        .from('tokens')
        .update({ hp_current: token.hp_current })
        .eq('id', tokenId)
        .eq('scene_id', sceneId)
        .eq('campaign_id', campaignId)
        .eq('hp_current', newHP)
        .select('id')
        .maybeSingle()
      if (rollbackError || !rolledBack) {
        return { error: 'HP персонажа изменились; проверьте синхронизацию с токеном вручную' }
      }
      return { error: 'HP персонажа некорректны или меньше HP токена; изменение отменено' }
    }
    data.hp = { ...characterHP, current: newHP }

    const { data: updatedCharacter, error: characterUpdateError } = await supabase
      .from('characters')
      .update({ data_json: data })
      .eq('id', token.character_id)
      .eq('campaign_id', campaignId)
      // Reject stale whole-document writes if another action changed the sheet.
      .eq('data_json', JSON.stringify(previous))
      .select('id')
      .maybeSingle()

    if (characterUpdateError || !updatedCharacter) {
      // Best-effort rollback, guarded by the value written above to reduce the chance of overwriting a concurrent change.
      const { data: rolledBack, error: rollbackError } = await supabase
        .from('tokens')
        .update({ hp_current: token.hp_current })
        .eq('id', tokenId)
        .eq('scene_id', sceneId)
        .eq('campaign_id', campaignId)
        .eq('hp_current', newHP)
        .select('id')
        .maybeSingle()

      if (rollbackError || !rolledBack) {
        return { error: 'Не удалось синхронизировать HP персонажа и восстановить HP токена; проверьте значения HP вручную' }
      }
      return { error: 'Не удалось обновить HP персонажа; изменение HP токена отменено' }
    }
  }

  revalidatePath(`/campaign/${campaignId}/scenes/${sceneId}`)
  if (token.character_id) revalidatePath(`/campaign/${campaignId}/characters/${token.character_id}`)

  await logEvent(
    campaignId,
    'token_damage',
    `${token.name}: ${type === 'damage' ? '-' : type === 'heal' ? '+' : ''}${amount} HP`
  )

  return { success: true, hp: newHP }
}
