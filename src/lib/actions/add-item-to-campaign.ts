'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCampaignAccess } from '@/lib/queries/access'

export async function addSrdItemToCampaign(
  itemKey: string,
  campaignId: string
) {
  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Нет прав' }

  const supabase = await createClient()

  // Загружаем предмет
  const { data: srdItem } = await supabase
    .from('srd_items')
    .select('*')
    .eq('key', itemKey)
    .single()

  if (!srdItem) return { error: 'Предмет не найден' }

  const itemData = srdItem.data as any

  // Создаем entity
  const { data: entity, error } = await supabase
    .from('entities')
    .insert({
      campaign_id: campaignId,
      type: 'item',
      name: srdItem.name_ru ?? srdItem.name,
      description: itemData.description ?? '',
      data_json: {
        rarity: itemData.rarity,
        item_type: itemData.item_type,
        cost: itemData.cost,
        weight: itemData.weight,
        attunement: itemData.attunement,
      },
      is_visible_to_players: true,
    })
    .select('id')
    .single()

  if (error) {
    console.error('addSrdItemToCampaign error:', error)
    return { error: 'Не удалось добавить' }
  }

  revalidatePath(`/campaign/${campaignId}/entities`)
  revalidatePath(`/campaign/${campaignId}/items`)

  return { success: true, entityId: entity.id }
}