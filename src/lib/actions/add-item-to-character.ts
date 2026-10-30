'use server'

import { randomUUID } from 'node:crypto'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCampaignAccess } from '@/lib/queries/access'
import { srdInventoryMetadata } from '@/lib/dnd/srd-inventory-metadata'
import type { CharacterData, CharacterInventoryItem } from '@/lib/types'

export async function addSrdItemToCharacter(
  itemKey: string,
  characterId: string,
  campaignId: string
) {
  if (typeof itemKey !== 'string' || !/^[a-z0-9][a-z0-9_-]{0,119}$/i.test(itemKey))
    return { error: 'Некорректный предмет' }
  if (
    typeof characterId !== 'string' ||
    !characterId ||
    typeof campaignId !== 'string' ||
    !campaignId
  )
    return { error: 'Некорректные данные персонажа' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Не авторизован' }

  const { isDm } = await getCampaignAccess(campaignId)

  // Загружаем предмет
  const { data: srdItem, error: itemError } = await supabase
    .from('srd_items')
    .select('*')
    .eq('key', itemKey)
    .maybeSingle()
  if (itemError) return { error: 'Не удалось загрузить предмет' }

  if (!srdItem) return { error: 'Предмет не найден' }

  if (!srdItem.data || typeof srdItem.data !== 'object' || Array.isArray(srdItem.data)) {
    return { error: 'Некорректные данные предмета' }
  }
  const itemData = srdItem.data as any

  // Загружаем персонажа
  const { data: character } = await supabase
    .from('characters')
    .select('user_id, data_json')
    .eq('id', characterId)
    .eq('campaign_id', campaignId)
    .single()

  if (!character) return { error: 'Персонаж не найден' }

  const isOwner = character.user_id === user.id
  if (!isOwner && !isDm) return { error: 'Нет прав' }

  if (
    !character.data_json ||
    typeof character.data_json !== 'object' ||
    Array.isArray(character.data_json)
  ) {
    return { error: 'Некорректные данные персонажа. Обновите страницу.' }
  }
  const charData = character.data_json as CharacterData
  if (charData.inventory != null && !Array.isArray(charData.inventory)) {
    return { error: 'Некорректные данные инвентаря. Предмет не добавлен.' }
  }
  const inventory = Array.isArray(charData.inventory) ? charData.inventory : []
  if (inventory.length >= 500) return { error: 'Инвентарь персонажа достиг лимита' }

  // Парсим вес
  let weight: number | undefined
  if (itemData.weight) {
    const parsed = parseFloat(String(itemData.weight))
    if (!isNaN(parsed)) weight = parsed
  }

  const newItem: CharacterInventoryItem = {
    id: `item-${randomUUID()}`,
    name: srdItem.name_ru ?? srdItem.name,
    quantity: 1,
    weight,
    notes: itemData.description?.slice(0, 200),
    ...srdInventoryMetadata(itemData),
  }

  const newData: CharacterData = {
    ...charData,
    inventory: [...inventory, newItem],
  }

  const { data: changed, error } = await supabase.rpc('update_character_data_cas', {
    p_character_id: characterId,
    p_campaign_id: campaignId,
    p_expected: character.data_json,
    p_next: newData,
  })

  if (error || changed !== true) {
    console.error('addSrdItemToCharacter error:', error)
    return {
      error: error
        ? 'Не удалось добавить'
        : 'Персонаж изменился. Обновите страницу и повторите действие.',
    }
  }

  revalidatePath(`/campaign/${campaignId}/characters/${characterId}`)
  return { success: true }
}
