'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCampaignAccess } from '@/lib/queries/access'
import type {
  CharacterData,
  CharacterInventoryItem,
} from '@/lib/types'

export async function addSrdItemToCharacter(
  itemKey: string,
  characterId: string,
  campaignId: string
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Не авторизован' }

  const { isDm } = await getCampaignAccess(campaignId)

  // Загружаем предмет
  const { data: srdItem } = await supabase
    .from('srd_items')
    .select('*')
    .eq('key', itemKey)
    .single()

  if (!srdItem) return { error: 'Предмет не найден' }

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

  const charData = character.data_json as CharacterData

  // Парсим вес
  let weight: number | undefined
  if (itemData.weight) {
    const parsed = parseFloat(String(itemData.weight))
    if (!isNaN(parsed)) weight = parsed
  }

  const newItem: CharacterInventoryItem = {
    id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: srdItem.name_ru ?? srdItem.name,
    quantity: 1,
    weight,
    notes: itemData.description?.slice(0, 200),
  }

  const newData: CharacterData = {
    ...charData,
    inventory: [...(charData.inventory ?? []), newItem],
  }

  const { error } = await supabase
    .from('characters')
    .update({ data_json: newData })
    .eq('id', characterId)
    .eq('campaign_id', campaignId)

  if (error) {
    console.error('addSrdItemToCharacter error:', error)
    return { error: 'Не удалось добавить' }
  }

  revalidatePath(`/campaign/${campaignId}/characters/${characterId}`)
  return { success: true }
}