'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCampaignAccess } from '@/lib/queries/access'
import { normalizeTagName, TAG_COLORS } from '@/lib/types'

/**
 * Добавляет тег к сущности. Если тега нет — создает.
 */
export async function addTagToEntity(entityId: string, campaignId: string, tagName: string) {
  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Нет прав' }

  const normalized = normalizeTagName(tagName)
  if (!normalized) return { error: 'Пустое имя тега' }

  const supabase = await createClient()

  // Проверяем, что сущность в кампании
  const { data: entity } = await supabase
    .from('entities')
    .select('id')
    .eq('id', entityId)
    .eq('campaign_id', campaignId)
    .single()

  if (!entity) return { error: 'Сущность не найдена' }

  // Ищем существующий тег (регистронезависимо)
  const { data: existingTags } = await supabase
    .from('tags')
    .select('id')
    .eq('campaign_id', campaignId)
    .ilike('name', normalized)
    .limit(1)

  let tagId: string

  if (existingTags && existingTags.length > 0) {
    tagId = existingTags[0].id
  } else {
    // Создаем новый тег со случайным цветом
    const color = TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)]

    const { data: newTag, error: tagError } = await supabase
      .from('tags')
      .insert({
        campaign_id: campaignId,
        name: normalized,
        color,
      })
      .select('id')
      .single()

    if (tagError || !newTag) {
      console.error('addTagToEntity tag create error:', tagError)
      return { error: 'Не удалось создать тег' }
    }

    tagId = newTag.id
  }

  // Связываем (на случай дубликата — on conflict do nothing)
  const { error: linkError } = await supabase
    .from('entity_tags')
    .upsert(
      { entity_id: entityId, tag_id: tagId },
      { onConflict: 'entity_id,tag_id', ignoreDuplicates: true }
    )

  if (linkError) {
    console.error('addTagToEntity link error:', linkError)
    return { error: 'Не удалось добавить тег' }
  }

  revalidatePath(`/campaign/${campaignId}/entities/${entityId}`)
  revalidatePath(`/campaign/${campaignId}/entities`)
  return { success: true, tagId }
}

/**
 * Удаляет тег с сущности.
 */
export async function removeTagFromEntity(entityId: string, tagId: string, campaignId: string) {
  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Нет прав' }

  const supabase = await createClient()

  const { error } = await supabase
    .from('entity_tags')
    .delete()
    .eq('entity_id', entityId)
    .eq('tag_id', tagId)

  if (error) {
    console.error('removeTagFromEntity error:', error)
    return { error: 'Не удалось удалить тег' }
  }

  revalidatePath(`/campaign/${campaignId}/entities/${entityId}`)
  revalidatePath(`/campaign/${campaignId}/entities`)
  return { success: true }
}

/**
 * Переименовывает тег (глобально в кампании).
 */
export async function renameTag(tagId: string, campaignId: string, newName: string) {
  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Нет прав' }

  const normalized = normalizeTagName(newName)
  if (!normalized) return { error: 'Пустое имя' }

  const supabase = await createClient()

  const { error } = await supabase
    .from('tags')
    .update({ name: normalized })
    .eq('id', tagId)
    .eq('campaign_id', campaignId)

  if (error) {
    if (error.code === '23505') {
      return { error: 'Такой тег уже есть' }
    }
    console.error('renameTag error:', error)
    return { error: 'Не удалось переименовать' }
  }

  revalidatePath(`/campaign/${campaignId}/entities`)
  return { success: true }
}

/**
 * Удаляет тег глобально (со всех сущностей).
 */
export async function deleteTag(tagId: string, campaignId: string) {
  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Нет прав' }

  const supabase = await createClient()

  const { error } = await supabase
    .from('tags')
    .delete()
    .eq('id', tagId)
    .eq('campaign_id', campaignId)

  if (error) {
    console.error('deleteTag error:', error)
    return { error: 'Не удалось удалить тег' }
  }

  revalidatePath(`/campaign/${campaignId}/entities`)
  return { success: true }
}
