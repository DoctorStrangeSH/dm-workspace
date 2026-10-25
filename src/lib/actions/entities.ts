'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCampaignAccess } from '@/lib/queries/access'
import type { EntityType } from '@/lib/types'

const VALID_TYPES: EntityType[] = ['npc', 'location', 'item', 'monster', 'faction', 'quest', 'note']

export async function createEntity(campaignId: string, formData: FormData) {
  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Нет прав' }

  const name = (formData.get('name') as string)?.trim()
  const type = (formData.get('type') as string)?.trim() as EntityType
  const description = (formData.get('description') as string)?.trim() || ''
  const dataJsonRaw = formData.get('data_json') as string | null

  // Парсим data_json из формы (если есть)
  let dataJson: Record<string, unknown> = {}
  if (dataJsonRaw) {
    try {
      const parsed = JSON.parse(dataJsonRaw)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        dataJson = parsed
      }
    } catch {
      // ignore — оставляем пустой объект
    }
  }

  if (!name || name.length < 2) {
    return { error: 'Имя должно быть минимум 2 символа' }
  }
  if (name.length > 150) {
    return { error: 'Имя слишком длинное (макс. 150)' }
  }
  if (!VALID_TYPES.includes(type)) {
    return { error: 'Неверный тип' }
  }
  if (description.length > 5000) {
    return { error: 'Описание слишком длинное (макс. 5000)' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('entities')
    .insert({
      campaign_id: campaignId,
      type,
      name,
      description,
      data_json: dataJson,
    })
    .select('id')
    .single()

  if (error) {
    console.error('createEntity error:', error)
    return { error: 'Не удалось создать сущность' }
  }

  revalidatePath(`/campaign/${campaignId}/entities`)
  return { success: true, entityId: data.id }
}

export async function updateEntity(
  entityId: string,
  campaignId: string,
  data: {
    name?: string
    description?: string
    image_url?: string | null
    is_visible_to_players?: boolean
    data_json?: Record<string, unknown>
  }
) {
  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Нет прав' }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { error: 'Некорректные данные сущности' }
  }

  // Never pass the caller's object directly to the database: server-action
  // arguments are runtime input, regardless of their TypeScript annotation.
  const safeUpdates: {
    name?: string
    description?: string
    image_url?: string | null
    is_visible_to_players?: boolean
    data_json?: Record<string, unknown>
  } = {}

  if (data.name !== undefined) {
    if (typeof data.name !== 'string') return { error: 'Некорректное имя' }
    const trimmed = data.name.trim()
    if (trimmed.length < 2) return { error: 'Имя слишком короткое' }
    if (trimmed.length > 150) return { error: 'Имя слишком длинное' }
    safeUpdates.name = trimmed
  }

  if (data.description !== undefined) {
    if (typeof data.description !== 'string') return { error: 'Некорректное описание' }
    if (data.description.length > 5000) return { error: 'Описание слишком длинное' }
    safeUpdates.description = data.description
  }

  if (data.image_url !== undefined) {
    if (data.image_url !== null && (typeof data.image_url !== 'string' || data.image_url.length > 2048)) {
      return { error: 'Некорректная ссылка на изображение' }
    }
    safeUpdates.image_url = data.image_url
  }

  if (data.is_visible_to_players !== undefined) {
    if (typeof data.is_visible_to_players !== 'boolean') {
      return { error: 'Некорректная видимость сущности' }
    }
    safeUpdates.is_visible_to_players = data.is_visible_to_players
  }

  if (data.data_json !== undefined) {
    const value: unknown = data.data_json
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return { error: 'Некорректные данные сущности' }
    }
    if (JSON.stringify(value).length > 100_000) {
      return { error: 'Данные сущности слишком большие' }
    }
    safeUpdates.data_json = value as Record<string, unknown>
  }

  if (Object.keys(safeUpdates).length === 0) {
    return { error: 'Нет изменений для сохранения' }
  }

  const supabase = await createClient()
  const { data: updated, error } = await supabase
    .from('entities')
    .update(safeUpdates)
    .eq('id', entityId)
    .eq('campaign_id', campaignId)
    .select('id')
    .maybeSingle()

  if (error || !updated) {
    console.error('updateEntity error:', error)
    return { error: 'Не удалось обновить' }
  }

  revalidatePath(`/campaign/${campaignId}/entities`)
  revalidatePath(`/campaign/${campaignId}/entities/${entityId}`)
  return { success: true }
}

export async function deleteEntity(entityId: string, campaignId: string) {
  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Нет прав' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('entities')
    .delete()
    .eq('id', entityId)
    .eq('campaign_id', campaignId)

  if (error) {
    console.error('deleteEntity error:', error)
    return { error: 'Не удалось удалить' }
  }

  revalidatePath(`/campaign/${campaignId}/entities`)
  return { success: true }
}

/**
 * Найти сущности по имени (для [[плашек]]).
 */
export async function findEntitiesByName(
  campaignId: string,
  names: string[]
): Promise<Record<string, string>> {
  if (names.length === 0) return {}

  const supabase = await createClient()
  const { data } = await supabase
    .from('entities')
    .select('id, name')
    .eq('campaign_id', campaignId)
    .in('name', names)

  const map: Record<string, string> = {}
  for (const e of data ?? []) {
    map[e.name] = e.id
  }
  return map
}
