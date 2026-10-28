'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCampaignAccess } from '@/lib/queries/access'
import {
  createEmptyCharacterData,
  type CharacterData,
  type CharacterSpell,
  type SpellSlots,
  type CharacterInventoryItem,
} from '@/lib/types'
import { getAverageHP, rollHP, applyLevelUp } from '@/lib/dnd/level-up'
import { isSubclassForClass, baseClassSlug } from '@/lib/dnd/srd-class-utils'
import { abilityModifier } from '@/lib/dnd/formulas'
import { getSpellcastingAbility } from '@/lib/dnd/constants'
import { logEvent } from './logs'

// ============================================================
// Типы результатов
// ============================================================

type ErrorResult = { error: string }
type SuccessResult = { success: true }
// CHANGES: {} → { success: true }, чтобы не пропускать 0/""/false
type SaveResult = ErrorResult | { success: true }

// ============================================================
// Базовые actions
// ============================================================

export async function createCharacter(
  campaignId: string,
  name: string,
  initialData?: Partial<CharacterData>
): Promise<ErrorResult | { success: true; characterId: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { isMember } = await getCampaignAccess(campaignId)
  if (!isMember) return { error: 'Нет доступа к кампании' }

  const trimmed = name.trim()
  if (!trimmed || trimmed.length < 2) return { error: 'Имя должно быть минимум 2 символа' }
  if (trimmed.length > 150) return { error: 'Имя слишком длинное' }

  const data: CharacterData = { ...createEmptyCharacterData(), ...initialData }
  if (data.subclass !== undefined && !isSubclassForClass(data.subclass, baseClassSlug(data.class))) {
    return { error: 'Подкласс не соответствует классу персонажа' }
  }
  const ability = getSpellcastingAbility(data.class)
  if (ability) data.spellcastingAbility = ability

  const { data: created, error } = await supabase
    .from('characters')
    .insert({ campaign_id: campaignId, user_id: user.id, name: trimmed, data_json: data })
    .select('id')
    .single()

  if (error) return { error: 'Не удалось создать персонажа' }

  revalidatePath(`/campaign/${campaignId}/characters`)
  return { success: true, characterId: created.id }
}

export async function updateCharacter(
  characterId: string,
  campaignId: string,
  updates: {
    name?: string
    data_json?: CharacterData
    is_active?: boolean
    is_visible_to_party?: boolean
  }
): Promise<ErrorResult | SuccessResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { data: character } = await supabase
    .from('characters')
    .select('user_id')
    .eq('id', characterId)
    .eq('campaign_id', campaignId)
    .single()

  if (!character) return { error: 'Персонаж не найден' }

  const { isDm } = await getCampaignAccess(campaignId)
  const isOwner = character.user_id === user.id
  if (!isOwner && !isDm) return { error: 'Нет прав' }

  // TypeScript types do not validate requests sent directly to a server action.
  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
    return { error: 'Некорректные изменения персонажа' }
  }

  // Build an explicit allowlist so extra fields cannot mutate ownership or other columns.
  const safeUpdates: {
    name?: string
    data_json?: CharacterData
    is_active?: boolean
    is_visible_to_party?: boolean
  } = {}

  if (updates.name !== undefined) {
    if (typeof updates.name !== 'string') return { error: 'Некорректное имя' }
    const trimmed = updates.name.trim()
    if (trimmed.length < 2) return { error: 'Имя слишком короткое' }
    if (trimmed.length > 150) return { error: 'Имя слишком длинное' }
    safeUpdates.name = trimmed
  }

  if (updates.data_json !== undefined) {
    const value: unknown = updates.data_json
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return { error: 'Некорректные данные персонажа' }
    }
    if (JSON.stringify(value).length > 200_000) {
      return { error: 'Данные персонажа слишком большие' }
    }
    const characterData = value as CharacterData
    if (characterData.subclass !== undefined && !isSubclassForClass(characterData.subclass, baseClassSlug(characterData.class))) {
      return { error: 'Подкласс не соответствует классу персонажа' }
    }
    safeUpdates.data_json = characterData
  }

  if (updates.is_active !== undefined) {
    if (typeof updates.is_active !== 'boolean') return { error: 'Некорректный статус персонажа' }
    safeUpdates.is_active = updates.is_active
  }

  if (updates.is_visible_to_party !== undefined) {
    if (typeof updates.is_visible_to_party !== 'boolean') {
      return { error: 'Некорректная видимость персонажа' }
    }
    safeUpdates.is_visible_to_party = updates.is_visible_to_party
  }

  if (Object.keys(safeUpdates).length === 0) {
    return { error: 'Нет изменений для сохранения' }
  }

  const { data: updated, error } = await supabase
    .from('characters')
    .update(safeUpdates)
    .eq('id', characterId)
    .eq('campaign_id', campaignId)
    .select('id')
    .maybeSingle()

  if (error || !updated) return { error: 'Не удалось обновить' }

  revalidatePath(`/campaign/${campaignId}/characters`)
  revalidatePath(`/campaign/${campaignId}/characters/${characterId}`)
  return { success: true }
}

export async function deleteCharacter(
  characterId: string,
  campaignId: string
): Promise<ErrorResult | SuccessResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { data: character } = await supabase
    .from('characters')
    .select('user_id')
    .eq('id', characterId)
    .eq('campaign_id', campaignId)
    .single()

  if (!character) return { error: 'Персонаж не найден' }

  const { isDm } = await getCampaignAccess(campaignId)
  const isOwner = character.user_id === user.id
  if (!isOwner && !isDm) return { error: 'Нет прав' }

  const { error } = await supabase
    .from('characters')
    .delete()
    .eq('id', characterId)
    .eq('campaign_id', campaignId)

  if (error) return { error: 'Не удалось удалить' }

  revalidatePath(`/campaign/${campaignId}/characters`)
  return { success: true }
}

// ============================================================
// Helpers
// ============================================================

type AccessResult =
  | { error: string }
  | {
      user: { id: string }
      data: CharacterData
      name: string
      canEdit: boolean
    }

async function checkCharacterAccess(
  characterId: string,
  campaignId: string
): Promise<AccessResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { data: character } = await supabase
    .from('characters')
    .select('user_id, data_json, name')
    .eq('id', characterId)
    .eq('campaign_id', campaignId)
    .single()

  if (!character) return { error: 'Персонаж не найден' }

  const { isDm } = await getCampaignAccess(campaignId)
  const isOwner = character.user_id === user.id

  return {
    user,
    data: character.data_json as CharacterData,
    name: character.name as string,
    canEdit: isOwner || isDm,
  }
}

async function saveCharacterData(
  characterId: string,
  campaignId: string,
  data: CharacterData
): Promise<SaveResult> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('characters')
    .update({ data_json: data })
    .eq('id', characterId)
    .eq('campaign_id', campaignId)

  if (error) return { error: 'Не удалось сохранить' }
  // CHANGES: {} → { success: true } (типобезопасно)
  return { success: true }
}

// ============================================================
// HP
// ============================================================

export async function updateCharacterHP(
  characterId: string,
  campaignId: string,
  newHP: { current?: number; max?: number; temp?: number }
): Promise<ErrorResult | SuccessResult> {
  const access = await checkCharacterAccess(characterId, campaignId)
  if ('error' in access) return access
  if (!access.canEdit) return { error: 'Нет прав' }

  const newData: CharacterData = {
    ...access.data,
    hp: { ...access.data.hp, ...newHP },
  }
  if (newData.hp.current > newData.hp.max) newData.hp.current = newData.hp.max
  if (newData.hp.current < 0) newData.hp.current = 0

  const save = await saveCharacterData(characterId, campaignId, newData)
  if ('error' in save) return save

  revalidatePath(`/campaign/${campaignId}/characters/${characterId}`)
  return { success: true }
}

// ============================================================
// Death Saves
// ============================================================

export type DeathSaveStatus = 'dead' | 'stabilized' | 'success' | 'fail'

export type RollDeathSaveResult =
  | { error: string }
  | {
      success: true
      roll: number
      status: DeathSaveStatus
      isNatural20: boolean
      isNatural1: boolean
      deathSaves: { successes: number; failures: number; stabilized: boolean }
    }

export async function rollDeathSave(
  characterId: string,
  campaignId: string
): Promise<RollDeathSaveResult> {
  const access = await checkCharacterAccess(characterId, campaignId)
  if ('error' in access) return access
  if (!access.canEdit) return { error: 'Нет прав' }

  const data = access.data
  const deathSaves = data.deathSaves ?? { successes: 0, failures: 0, stabilized: false }
  const roll = Math.floor(Math.random() * 20) + 1

  let status: DeathSaveStatus
  let isNatural20 = false
  let isNatural1 = false

  if (roll === 20) {
    isNatural20 = true
    deathSaves.successes = 0
    deathSaves.failures = 0
    deathSaves.stabilized = false
    data.hp.current = 1
    status = 'success'
  } else if (roll === 1) {
    isNatural1 = true
    deathSaves.failures = Math.min(3, deathSaves.failures + 2)
    status = 'fail'
  } else if (roll >= 10) {
    deathSaves.successes = Math.min(3, deathSaves.successes + 1)
    status = 'success'
  } else {
    deathSaves.failures = Math.min(3, deathSaves.failures + 1)
    status = 'fail'
  }

  if (deathSaves.successes >= 3) {
    deathSaves.stabilized = true
    status = 'stabilized'
  } else if (deathSaves.failures >= 3) {
    status = 'dead'
  }

  const save = await saveCharacterData(characterId, campaignId, { ...data, deathSaves })
  if ('error' in save) return save

  revalidatePath(`/campaign/${campaignId}/characters/${characterId}`)
  return {
    success: true,
    roll,
    status,
    isNatural20,
    isNatural1,
    deathSaves,
  }
}

export async function resetDeathSaves(
  characterId: string,
  campaignId: string
): Promise<ErrorResult | SuccessResult> {
  const access = await checkCharacterAccess(characterId, campaignId)
  if ('error' in access) return access
  if (!access.canEdit) return { error: 'Нет прав' }

  const save = await saveCharacterData(characterId, campaignId, {
    ...access.data,
    deathSaves: { successes: 0, failures: 0, stabilized: false },
  })
  if ('error' in save) return save

  revalidatePath(`/campaign/${campaignId}/characters/${characterId}`)
  return { success: true }
}

// ============================================================
// Spells
// ============================================================

export async function addSpell(
  characterId: string,
  campaignId: string,
  spell: Omit<CharacterSpell, 'id'>
): Promise<ErrorResult | { success: true; spellId: string }> {
  const access = await checkCharacterAccess(characterId, campaignId)
  if ('error' in access) return access
  if (!access.canEdit) return { error: 'Нет прав' }

  const newSpell: CharacterSpell = {
    ...spell,
    id: `spell-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  }
  const newData: CharacterData = {
    ...access.data,
    spells: [...(access.data.spells ?? []), newSpell],
  }

  const save = await saveCharacterData(characterId, campaignId, newData)
  if ('error' in save) return save

  revalidatePath(`/campaign/${campaignId}/characters/${characterId}`)
  return { success: true, spellId: newSpell.id }
}

export async function updateSpell(
  characterId: string,
  campaignId: string,
  spellId: string,
  updates: Partial<CharacterSpell>
): Promise<ErrorResult | SuccessResult> {
  const access = await checkCharacterAccess(characterId, campaignId)
  if ('error' in access) return access
  if (!access.canEdit) return { error: 'Нет прав' }

  const spells = (access.data.spells ?? []).map((s) =>
    s.id === spellId ? { ...s, ...updates } : s
  )
  const save = await saveCharacterData(characterId, campaignId, { ...access.data, spells })
  if ('error' in save) return save

  revalidatePath(`/campaign/${campaignId}/characters/${characterId}`)
  return { success: true }
}

export async function removeSpell(
  characterId: string,
  campaignId: string,
  spellId: string
): Promise<ErrorResult | SuccessResult> {
  const access = await checkCharacterAccess(characterId, campaignId)
  if ('error' in access) return access
  if (!access.canEdit) return { error: 'Нет прав' }

  const spells = (access.data.spells ?? []).filter((s) => s.id !== spellId)
  const save = await saveCharacterData(characterId, campaignId, { ...access.data, spells })
  if ('error' in save) return save

  revalidatePath(`/campaign/${campaignId}/characters/${characterId}`)
  return { success: true }
}

// CHANGES: useSpellSlot → spendSpellSlot (семантически точнее, ESLint не считает хуком)
export async function spendSpellSlot(
  characterId: string,
  campaignId: string,
  level: number,
  action: 'use' | 'restore'
): Promise<ErrorResult | { success: true; current: number }> {
  const access = await checkCharacterAccess(characterId, campaignId)
  if ('error' in access) return access
  if (!access.canEdit) return { error: 'Нет прав' }

  const slots: SpellSlots = { ...(access.data.spellSlots ?? {}) }
  const current = slots[level]
  if (!current) return { error: 'Нет ячеек этого уровня' }

  const delta = action === 'use' ? -1 : 1
  slots[level] = {
    ...current,
    current: Math.max(0, Math.min(current.max, current.current + delta)),
  }

  const save = await saveCharacterData(characterId, campaignId, {
    ...access.data,
    spellSlots: slots,
  })
  if ('error' in save) return save

  revalidatePath(`/campaign/${campaignId}/characters/${characterId}`)
  return { success: true, current: slots[level].current }
}

export async function longRest(
  characterId: string,
  campaignId: string
): Promise<ErrorResult | SuccessResult> {
  const access = await checkCharacterAccess(characterId, campaignId)
  if ('error' in access) return access
  if (!access.canEdit) return { error: 'Нет прав' }

  const newSlots: SpellSlots = {}
  for (const [level, slot] of Object.entries(access.data.spellSlots ?? {})) {
    newSlots[Number(level)] = { ...slot, current: slot.max }
  }

  const save = await saveCharacterData(characterId, campaignId, {
    ...access.data,
    hp: { ...access.data.hp, current: access.data.hp.max, temp: 0 },
    spellSlots: newSlots,
    deathSaves: { successes: 0, failures: 0, stabilized: false },
  })
  if ('error' in save) return save

  revalidatePath(`/campaign/${campaignId}/characters/${characterId}`)
  return { success: true }
}

// ============================================================
// Inventory
// ============================================================

export async function addInventoryItem(
  characterId: string,
  campaignId: string,
  item: Omit<CharacterInventoryItem, 'id'>
): Promise<ErrorResult | { success: true; itemId: string }> {
  const access = await checkCharacterAccess(characterId, campaignId)
  if ('error' in access) return access
  if (!access.canEdit) return { error: 'Нет прав' }

  const newItem: CharacterInventoryItem = {
    ...item,
    id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  }
  const inventory = [...(access.data.inventory ?? []), newItem]

  const save = await saveCharacterData(characterId, campaignId, { ...access.data, inventory })
  if ('error' in save) return save

  revalidatePath(`/campaign/${campaignId}/characters/${characterId}`)
  return { success: true, itemId: newItem.id }
}

export async function updateInventoryItem(
  characterId: string,
  campaignId: string,
  itemId: string,
  updates: Partial<Omit<CharacterInventoryItem, 'id'>>
): Promise<ErrorResult | SuccessResult> {
  const access = await checkCharacterAccess(characterId, campaignId)
  if ('error' in access) return access
  if (!access.canEdit) return { error: 'Нет прав' }

  const inventory = (access.data.inventory ?? []).map((item) =>
    item.id === itemId ? { ...item, ...updates } : item
  )
  const save = await saveCharacterData(characterId, campaignId, { ...access.data, inventory })
  if ('error' in save) return save

  revalidatePath(`/campaign/${campaignId}/characters/${characterId}`)
  return { success: true }
}

export async function removeInventoryItem(
  characterId: string,
  campaignId: string,
  itemId: string
): Promise<ErrorResult | SuccessResult> {
  const access = await checkCharacterAccess(characterId, campaignId)
  if ('error' in access) return access
  if (!access.canEdit) return { error: 'Нет прав' }

  const inventory = (access.data.inventory ?? []).filter((item) => item.id !== itemId)
  const save = await saveCharacterData(characterId, campaignId, { ...access.data, inventory })
  if ('error' in save) return save

  revalidatePath(`/campaign/${campaignId}/characters/${characterId}`)
  return { success: true }
}

export async function updateCurrency(
  characterId: string,
  campaignId: string,
  currency: { pp?: number; gp?: number; sp?: number; cp?: number }
): Promise<ErrorResult | SuccessResult> {
  const access = await checkCharacterAccess(characterId, campaignId)
  if ('error' in access) return access
  if (!access.canEdit) return { error: 'Нет прав' }

  const save = await saveCharacterData(characterId, campaignId, { ...access.data, currency })
  if ('error' in save) return save

  revalidatePath(`/campaign/${campaignId}/characters/${characterId}`)
  return { success: true }
}

export async function toggleEquipped(
  characterId: string,
  campaignId: string,
  itemId: string
): Promise<ErrorResult | SuccessResult> {
  const access = await checkCharacterAccess(characterId, campaignId)
  if ('error' in access) return access
  if (!access.canEdit) return { error: 'Нет прав' }

  const inventory = (access.data.inventory ?? []).map((item) =>
    item.id === itemId ? { ...item, equipped: !item.equipped } : item
  )
  const save = await saveCharacterData(characterId, campaignId, { ...access.data, inventory })
  if ('error' in save) return save

  revalidatePath(`/campaign/${campaignId}/characters/${characterId}`)
  return { success: true }
}

export async function toggleAttuned(
  characterId: string,
  campaignId: string,
  itemId: string
): Promise<ErrorResult | SuccessResult> {
  const access = await checkCharacterAccess(characterId, campaignId)
  if ('error' in access) return access
  if (!access.canEdit) return { error: 'Нет прав' }

  const inventory = access.data.inventory ?? []
  const current = inventory.find((item) => item.id === itemId)
  if (!current) return { error: 'Предмет не найден' }

  const attunedCount = inventory.filter((item) => item.attuned).length
  if (!current.attuned && attunedCount >= 3) {
    return { error: 'Максимум 3 attuned предмета' }
  }

  const updated = inventory.map((item) =>
    item.id === itemId ? { ...item, attuned: !item.attuned } : item
  )
  const save = await saveCharacterData(characterId, campaignId, {
    ...access.data,
    inventory: updated,
  })
  if ('error' in save) return save

  revalidatePath(`/campaign/${campaignId}/characters/${characterId}`)
  return { success: true }
}

// ============================================================
// Level Up
// ============================================================

export async function levelUp(
  characterId: string,
  campaignId: string,
  options: {
    hpMethod: 'average' | 'roll'
    abilityChanges?: Partial<Record<string, number>>
  }
): Promise<ErrorResult | { success: true; newLevel: number; hpGain: number }> {
  const access = await checkCharacterAccess(characterId, campaignId)
  if ('error' in access) return access
  if (!access.canEdit) return { error: 'Нет прав' }
  if (access.data.level >= 20) return { error: 'Максимальный уровень — 20' }

  const conMod = abilityModifier(access.data.abilities.con)
  const hpGain =
    options.hpMethod === 'roll'
      ? rollHP(access.data.class, conMod)
      : getAverageHP(access.data.class, conMod)

  const newData = applyLevelUp(access.data, hpGain, options.abilityChanges)

  if (!newData.spellcastingAbility) {
    const ability = getSpellcastingAbility(newData.class)
    if (ability) newData.spellcastingAbility = ability
  }

  const save = await saveCharacterData(characterId, campaignId, newData)
  if ('error' in save) return save

  await logEvent(campaignId, 'level_up', `${access.name} достиг уровня ${newData.level}`)

  revalidatePath(`/campaign/${campaignId}/characters/${characterId}`)
  return { success: true, newLevel: newData.level, hpGain }
}
