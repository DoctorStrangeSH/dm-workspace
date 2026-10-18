'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCampaignAccess } from '@/lib/queries/access'
import { createEmptyCharacterData, type CharacterData, type CharacterSpell, type SpellSlots } from '@/lib/types'
import { getAverageHP, rollHP, applyLevelUp } from '@/lib/dnd/level-up'
import { abilityModifier } from '@/lib/dnd/formulas'
import { getSpellcastingAbility } from '@/lib/dnd/constants'
import { logEvent } from './logs'

export async function createCharacter(campaignId: string, name: string, initialData?: Partial<CharacterData>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { isMember } = await getCampaignAccess(campaignId)
  if (!isMember) return { error: 'Нет доступа к кампании' }

  const trimmed = name.trim()
  if (!trimmed || trimmed.length < 2) return { error: 'Имя должно быть минимум 2 символа' }
  if (trimmed.length > 150) return { error: 'Имя слишком длинное' }

  const data: CharacterData = { ...createEmptyCharacterData(), ...initialData }
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

export async function updateCharacter(characterId: string, campaignId: string, updates: { name?: string; data_json?: CharacterData; is_active?: boolean; is_visible_to_party?: boolean }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
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

  if (updates.name !== undefined) {
    const trimmed = updates.name.trim()
    if (trimmed.length < 2) return { error: 'Имя слишком короткое' }
    if (trimmed.length > 150) return { error: 'Имя слишком длинное' }
    updates.name = trimmed
  }

  const { error } = await supabase.from('characters').update(updates).eq('id', characterId).eq('campaign_id', campaignId)
  if (error) return { error: 'Не удалось обновить' }

  revalidatePath(`/campaign/${campaignId}/characters`)
  revalidatePath(`/campaign/${campaignId}/characters/${characterId}`)
  return { success: true }
}

export async function deleteCharacter(characterId: string, campaignId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
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

  const { error } = await supabase.from('characters').delete().eq('id', characterId).eq('campaign_id', campaignId)
  if (error) return { error: 'Не удалось удалить' }

  revalidatePath(`/campaign/${campaignId}/characters`)
  return { success: true }
}

async function checkCharacterAccess(characterId: string, campaignId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' as const }

  const { data: character } = await supabase
    .from('characters')
    .select('user_id, data_json')
    .eq('id', characterId)
    .eq('campaign_id', campaignId)
    .single()

  if (!character) return { error: 'Персонаж не найден' as const }

  const { isDm } = await getCampaignAccess(campaignId)
  const isOwner = character.user_id === user.id

  return { user, data: character.data_json as CharacterData, canEdit: isOwner || isDm }
}

async function saveCharacterData(characterId: string, campaignId: string, data: CharacterData) {
  const supabase = await createClient()
  const { error } = await supabase.from('characters').update({ data_json: data }).eq('id', characterId).eq('campaign_id', campaignId)
  if (error) return { error: 'Не удалось сохранить' }
  return {}
}

export async function updateCharacterHP(characterId: string, campaignId: string, newHP: { current?: number; max?: number; temp?: number }) {
  const { data, canEdit, error } = await checkCharacterAccess(characterId, campaignId)
  if (error) return { error }
  if (!canEdit) return { error: 'Нет прав' }

  const newData: CharacterData = { ...data, hp: { ...data.hp, ...newHP } }
  if (newData.hp.current > newData.hp.max) newData.hp.current = newData.hp.max
  if (newData.hp.current < 0) newData.hp.current = 0

  const save = await saveCharacterData(characterId, campaignId, newData)
  if (save.error) return save

  revalidatePath(`/campaign/${campaignId}/characters/${characterId}`)
  return { success: true }
}

export async function rollDeathSave(characterId: string, campaignId: string) {
  const { data, canEdit, error } = await checkCharacterAccess(characterId, campaignId)
  if (error) return { error }
  if (!canEdit) return { error: 'Нет прав' }

  const deathSaves = data.deathSaves ?? { successes: 0, failures: 0, stabilized: false }
  const roll = Math.floor(Math.random() * 20) + 1
  let message = ''

  if (roll === 20) {
    deathSaves.successes = 0; deathSaves.failures = 0; deathSaves.stabilized = false
    data.hp.current = 1
    message = `🎉 Натуральная 20! Возврат к 1 HP`
  } else if (roll === 1) {
    deathSaves.failures = Math.min(3, deathSaves.failures + 2)
    message = `💀 Натуральная 1! 2 провала`
  } else if (roll >= 10) {
    deathSaves.successes = Math.min(3, deathSaves.successes + 1)
    message = `✅ Успех (${deathSaves.successes}/3)`
  } else {
    deathSaves.failures = Math.min(3, deathSaves.failures + 1)
    message = `❌ Провал (${deathSaves.failures}/3)`
  }

  if (deathSaves.successes >= 3) { deathSaves.stabilized = true; message += ' — стабилизирован' }
  else if (deathSaves.failures >= 3) message += ' — мёртв'

  const save = await saveCharacterData(characterId, campaignId, { ...data, deathSaves })
  if (save.error) return save

  revalidatePath(`/campaign/${campaignId}/characters/${characterId}`)
  return { success: true, roll, message, deathSaves }
}

export async function resetDeathSaves(characterId: string, campaignId: string) {
  const { data, canEdit, error } = await checkCharacterAccess(characterId, campaignId)
  if (error) return { error }
  if (!canEdit) return { error: 'Нет прав' }

  const save = await saveCharacterData(characterId, campaignId, {
    ...data,
    deathSaves: { successes: 0, failures: 0, stabilized: false },
  })
  if (save.error) return save

  revalidatePath(`/campaign/${campaignId}/characters/${characterId}`)
  return { success: true }
}

export async function addSpell(characterId: string, campaignId: string, spell: Omit<CharacterSpell, 'id'>) {
  const { data, canEdit, error } = await checkCharacterAccess(characterId, campaignId)
  if (error) return { error }
  if (!canEdit) return { error: 'Нет прав' }

  const newSpell: CharacterSpell = { ...spell, id: `spell-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` }
  const newData: CharacterData = { ...data, spells: [...(data.spells ?? []), newSpell] }

  const save = await saveCharacterData(characterId, campaignId, newData)
  if (save.error) return save

  revalidatePath(`/campaign/${campaignId}/characters/${characterId}`)
  return { success: true, spellId: newSpell.id }
}

export async function updateSpell(characterId: string, campaignId: string, spellId: string, updates: Partial<CharacterSpell>) {
  const { data, canEdit, error } = await checkCharacterAccess(characterId, campaignId)
  if (error) return { error }
  if (!canEdit) return { error: 'Нет прав' }

  const spells = (data.spells ?? []).map((s) => (s.id === spellId ? { ...s, ...updates } : s))
  const save = await saveCharacterData(characterId, campaignId, { ...data, spells })
  if (save.error) return save

  revalidatePath(`/campaign/${campaignId}/characters/${characterId}`)
  return { success: true }
}

export async function removeSpell(characterId: string, campaignId: string, spellId: string) {
  const { data, canEdit, error } = await checkCharacterAccess(characterId, campaignId)
  if (error) return { error }
  if (!canEdit) return { error: 'Нет прав' }

  const spells = (data.spells ?? []).filter((s) => s.id !== spellId)
  const save = await saveCharacterData(characterId, campaignId, { ...data, spells })
  if (save.error) return save

  revalidatePath(`/campaign/${campaignId}/characters/${characterId}`)
  return { success: true }
}

export async function useSpellSlot(characterId: string, campaignId: string, level: number, action: 'use' | 'restore') {
  const { data, canEdit, error } = await checkCharacterAccess(characterId, campaignId)
  if (error) return { error }
  if (!canEdit) return { error: 'Нет прав' }

  const slots: SpellSlots = { ...(data.spellSlots ?? {}) }
  const current = slots[level]
  if (!current) return { error: 'Нет ячеек этого уровня' }

  const delta = action === 'use' ? -1 : 1
  slots[level] = { ...current, current: Math.max(0, Math.min(current.max, current.current + delta)) }

  const save = await saveCharacterData(characterId, campaignId, { ...data, spellSlots: slots })
  if (save.error) return save

  revalidatePath(`/campaign/${campaignId}/characters/${characterId}`)
  return { success: true, current: slots[level].current }
}

export async function longRest(characterId: string, campaignId: string) {
  const { data, canEdit, error } = await checkCharacterAccess(characterId, campaignId)
  if (error) return { error }
  if (!canEdit) return { error: 'Нет прав' }

  const newSlots: SpellSlots = {}
  for (const [level, slot] of Object.entries(data.spellSlots ?? {})) {
    newSlots[Number(level)] = { ...slot, current: slot.max }
  }

  const save = await saveCharacterData(characterId, campaignId, {
    ...data,
    hp: { ...data.hp, current: data.hp.max, temp: 0 },
    spellSlots: newSlots,
    deathSaves: { successes: 0, failures: 0, stabilized: false },
  })
  if (save.error) return save

  revalidatePath(`/campaign/${campaignId}/characters/${characterId}`)
  return { success: true }
}

export async function addInventoryItem(characterId: string, campaignId: string, item: Omit<any, 'id'>) {
  const { data, canEdit, error } = await checkCharacterAccess(characterId, campaignId)
  if (error) return { error }
  if (!canEdit) return { error: 'Нет прав' }

  const newItem = { ...item, id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` }
  const inventory = [...(data.inventory ?? []), newItem]

  const save = await saveCharacterData(characterId, campaignId, { ...data, inventory })
  if (save.error) return save

  revalidatePath(`/campaign/${campaignId}/characters/${characterId}`)
  return { success: true, itemId: newItem.id }
}

export async function updateInventoryItem(characterId: string, campaignId: string, itemId: string, updates: Record<string, unknown>) {
  const { data, canEdit, error } = await checkCharacterAccess(characterId, campaignId)
  if (error) return { error }
  if (!canEdit) return { error: 'Нет прав' }

  const inventory = (data.inventory ?? []).map((item) => (item.id === itemId ? { ...item, ...updates } : item))
  const save = await saveCharacterData(characterId, campaignId, { ...data, inventory })
  if (save.error) return save

  revalidatePath(`/campaign/${campaignId}/characters/${characterId}`)
  return { success: true }
}

export async function removeInventoryItem(characterId: string, campaignId: string, itemId: string) {
  const { data, canEdit, error } = await checkCharacterAccess(characterId, campaignId)
  if (error) return { error }
  if (!canEdit) return { error: 'Нет прав' }

  const inventory = (data.inventory ?? []).filter((item) => item.id !== itemId)
  const save = await saveCharacterData(characterId, campaignId, { ...data, inventory })
  if (save.error) return save

  revalidatePath(`/campaign/${campaignId}/characters/${characterId}`)
  return { success: true }
}

export async function updateCurrency(characterId: string, campaignId: string, currency: Record<string, number>) {
  const { data, canEdit, error } = await checkCharacterAccess(characterId, campaignId)
  if (error) return { error }
  if (!canEdit) return { error: 'Нет прав' }

  const save = await saveCharacterData(characterId, campaignId, { ...data, currency })
  if (save.error) return save

  revalidatePath(`/campaign/${campaignId}/characters/${characterId}`)
  return { success: true }
}

export async function toggleEquipped(characterId: string, campaignId: string, itemId: string) {
  const { data, canEdit, error } = await checkCharacterAccess(characterId, campaignId)
  if (error) return { error }
  if (!canEdit) return { error: 'Нет прав' }

  const inventory = (data.inventory ?? []).map((item) => (item.id === itemId ? { ...item, equipped: !item.equipped } : item))
  const save = await saveCharacterData(characterId, campaignId, { ...data, inventory })
  if (save.error) return save

  revalidatePath(`/campaign/${campaignId}/characters/${characterId}`)
  return { success: true }
}

export async function toggleAttuned(characterId: string, campaignId: string, itemId: string) {
  const { data, canEdit, error } = await checkCharacterAccess(characterId, campaignId)
  if (error) return { error }
  if (!canEdit) return { error: 'Нет прав' }

  const inventory = data.inventory ?? []
  const current = inventory.find((item) => item.id === itemId)
  if (!current) return { error: 'Предмет не найден' }

  const attunedCount = inventory.filter((item) => item.attuned).length
  if (!current.attuned && attunedCount >= 3) return { error: 'Максимум 3 attuned предмета' }

  const updated = inventory.map((item) => (item.id === itemId ? { ...item, attuned: !item.attuned } : item))
  const save = await saveCharacterData(characterId, campaignId, { ...data, inventory: updated })
  if (save.error) return save

  revalidatePath(`/campaign/${campaignId}/characters/${characterId}`)
  return { success: true }
}

export async function levelUp(characterId: string, campaignId: string, options: { hpMethod: 'average' | 'roll'; abilityChanges?: Partial<Record<string, number>> }) {
  const { data, canEdit, error } = await checkCharacterAccess(characterId, campaignId)
  if (error) return { error }
  if (!canEdit) return { error: 'Нет прав' }
  if (data.level >= 20) return { error: 'Максимальный уровень — 20' }

  const conMod = abilityModifier(data.abilities.con)
  const hpGain = options.hpMethod === 'roll' ? rollHP(data.class, conMod) : getAverageHP(data.class, conMod)
  const newData = applyLevelUp(data, hpGain, options.abilityChanges)

  if (!newData.spellcastingAbility) {
    const ability = getSpellcastingAbility(newData.class)
    if (ability) newData.spellcastingAbility = ability
  }

  const save = await saveCharacterData(characterId, campaignId, newData)
  if (save.error) return save

  await logEvent(campaignId, 'level_up', `${newData.name} достиг уровня ${newData.level}`)

  revalidatePath(`/campaign/${campaignId}/characters/${characterId}`)
  return { success: true, newLevel: newData.level, hpGain }
}