'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCampaignAccess } from '@/lib/queries/access'
import type { GridType } from '@/lib/types'

export async function createScene(
  campaignId: string,
  data: {
    name: string
    grid_type?: GridType
    grid_size?: number
    width?: number
    height?: number
  }
) {
  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Нет прав' }

  if (!data || typeof data.name !== 'string') return { error: 'Некорректные данные сцены' }
  const name = data.name.trim()
  if (!name || name.length < 2) {
    return { error: 'Название минимум 2 символа' }
  }

  const gridType = data.grid_type ?? 'square'
  const gridSize = data.grid_size ?? 50
  const width = data.width ?? 30
  const height = data.height ?? 20
  if (!['square', 'hex', 'none'].includes(gridType)) return { error: 'Некорректный тип сетки' }
  if (![gridSize, width, height].every(Number.isFinite) || gridSize < 10 || gridSize > 200 || width < 1 || width > 500 || height < 1 || height > 500) {
    return { error: 'Некорректные размеры сцены' }
  }

  const supabase = await createClient()
  const { data: scene, error } = await supabase
    .from('scenes')
    .insert({
      campaign_id: campaignId,
      name,
      grid_type: gridType,
      grid_size: gridSize,
      width,
      height,
    })
    .select('id')
    .single()

  if (error) {
    console.error('createScene error:', error)
    return { error: 'Не удалось создать сцену' }
  }

  revalidatePath(`/campaign/${campaignId}/scenes`)
  return { success: true, sceneId: scene.id }
}

export async function updateScene(
  sceneId: string,
  campaignId: string,
  data: {
    name?: string
    grid_type?: GridType
    grid_size?: number
    width?: number
    height?: number
    image_url?: string | null
    fog_enabled?: boolean
  }
) {
  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Нет прав' }

  if (!data || typeof data !== 'object' || Array.isArray(data)) return { error: 'Некорректные данные сцены' }
  const safeData: Record<string, unknown> = {}
  const allowedKeys = ['name', 'grid_type', 'grid_size', 'width', 'height', 'image_url', 'fog_enabled'] as const
  for (const key of Object.keys(data)) {
    if (!allowedKeys.includes(key as (typeof allowedKeys)[number])) return { error: 'Недопустимое поле сцены' }
  }
  if (Object.keys(data).length === 0) return { error: 'Нет изменений' }
  if (data.name !== undefined) {
    if (typeof data.name !== 'string') return { error: 'Некорректное название' }
    const trimmed = data.name.trim()
    if (trimmed.length < 2) return { error: 'Название слишком короткое' }
    if (trimmed.length > 150) return { error: 'Название слишком длинное' }
    safeData.name = trimmed
  }
  if (data.grid_type !== undefined) {
    if (!['square', 'hex', 'none'].includes(data.grid_type)) return { error: 'Некорректный тип сетки' }
    safeData.grid_type = data.grid_type
  }
  for (const key of ['grid_size', 'width', 'height'] as const) {
    const value = data[key]
    if (value !== undefined) {
      const min = key === 'grid_size' ? 10 : 1
      const max = key === 'grid_size' ? 200 : 500
      if (!Number.isFinite(value) || value < min || value > max) return { error: 'Некорректные размеры сцены' }
      safeData[key] = value
    }
  }
  if (data.image_url !== undefined) {
    if (data.image_url !== null && (typeof data.image_url !== 'string' || data.image_url.length > 2048)) return { error: 'Некорректная ссылка на карту' }
    safeData.image_url = data.image_url
  }
  if (data.fog_enabled !== undefined) {
    if (typeof data.fog_enabled !== 'boolean') return { error: 'Некорректное состояние тумана' }
    safeData.fog_enabled = data.fog_enabled
  }

  const supabase = await createClient()
  const { data: updated, error } = await supabase
    .from('scenes')
    .update(safeData)
    .eq('id', sceneId)
    .eq('campaign_id', campaignId)
    .select('id')
    .maybeSingle()

  if (error || !updated) {
    console.error('updateScene error:', error)
    return { error: 'Не удалось обновить' }
  }

  revalidatePath(`/campaign/${campaignId}/scenes`)
  revalidatePath(`/campaign/${campaignId}/scenes/${sceneId}`)
  return { success: true }
}

export async function deleteScene(sceneId: string, campaignId: string) {
  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Нет прав' }

  const supabase = await createClient()
  const { data: deleted, error } = await supabase
    .from('scenes')
    .delete()
    .eq('id', sceneId)
    .eq('campaign_id', campaignId)
    .select('id')
    .maybeSingle()

  if (error || !deleted) {
    console.error('deleteScene error:', error)
    return { error: 'Не удалось удалить' }
  }

  revalidatePath(`/campaign/${campaignId}/scenes`)
  return { success: true }
}

export async function setActiveScene(sceneId: string, campaignId: string) {
  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Нет прав' }

  if (typeof sceneId !== 'string' || !sceneId || typeof campaignId !== 'string' || !campaignId) {
    return { error: 'Некорректная сцена' }
  }

  const supabase = await createClient()

  // Validate the target before changing the current active scene.
  const { data: target, error: targetError } = await supabase
    .from('scenes')
    .select('id')
    .eq('id', sceneId)
    .eq('campaign_id', campaignId)
    .maybeSingle()

  if (targetError || !target) {
    return { error: 'Сцена не найдена в этой кампании' }
  }

  // Do not report success if the current active scene could not be cleared.
  const { error: deactivateError } = await supabase
    .from('scenes')
    .update({ is_active: false })
    .eq('campaign_id', campaignId)
    .eq('is_active', true)

  if (deactivateError) {
    console.error('setActiveScene deactivate error:', deactivateError)
    return { error: 'Не удалось изменить активную сцену' }
  }

  // Check the affected row so a stale/deleted target is not reported as success.
  const { data: activated, error: activateError } = await supabase
    .from('scenes')
    .update({ is_active: true })
    .eq('id', sceneId)
    .eq('campaign_id', campaignId)
    .select('id')
    .maybeSingle()

  if (activateError || !activated) {
    if (activateError) console.error('setActiveScene activate error:', activateError)
    return { error: 'Не удалось активировать сцену' }
  }

  revalidatePath(`/campaign/${campaignId}/scenes`)
  revalidatePath(`/campaign/${campaignId}/scenes/${sceneId}`)
  return { success: true }
}

export async function uploadMap(sceneId: string, campaignId: string, file: File) {
  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Нет прав' }

  if (!(file instanceof File) || file.size === 0) return { error: 'Выберите файл карты' }
  if (file.size > 10 * 1024 * 1024) {
    return { error: 'Файл больше 10 MB' }
  }

  const extByMime: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }
  const ext = extByMime[file.type]
  if (!ext) return { error: 'Поддерживаются PNG, JPEG и WebP' }

  const supabase = await createClient()
  const { data: scene } = await supabase.from('scenes').select('id').eq('id', sceneId).eq('campaign_id', campaignId).maybeSingle()
  if (!scene) return { error: 'Сцена не принадлежит кампании' }
  const fileName = `${campaignId}/${sceneId}-${crypto.randomUUID()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('scene-maps')
    .upload(fileName, file, { upsert: true })

  if (uploadError) {
    console.error('uploadMap error:', uploadError)
    return { error: 'Не удалось загрузить' }
  }

  const { data: updated, error } = await supabase
    .from('scenes')
    .update({ image_url: fileName })
    .eq('id', sceneId)
    .eq('campaign_id', campaignId)
    .select('id')
    .maybeSingle()

  if (error || !updated) {
    return { error: 'Не удалось сохранить URL' }
  }

  revalidatePath(`/campaign/${campaignId}/scenes/${sceneId}`)
  return { success: true, url: '/api/scenes/' + sceneId + '/map' }
}
