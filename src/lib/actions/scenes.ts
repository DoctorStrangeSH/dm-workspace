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

  const name = data.name.trim()
  if (!name || name.length < 2) {
    return { error: 'Название минимум 2 символа' }
  }

  const supabase = await createClient()
  const { data: scene, error } = await supabase
    .from('scenes')
    .insert({
      campaign_id: campaignId,
      name,
      grid_type: data.grid_type ?? 'square',
      grid_size: data.grid_size ?? 50,
      width: data.width ?? 30,
      height: data.height ?? 20,
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

  if (data.name !== undefined) {
    const trimmed = data.name.trim()
    if (trimmed.length < 2) return { error: 'Название слишком короткое' }
    data.name = trimmed
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('scenes')
    .update(data)
    .eq('id', sceneId)
    .eq('campaign_id', campaignId)

  if (error) {
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
  const { error } = await supabase
    .from('scenes')
    .delete()
    .eq('id', sceneId)
    .eq('campaign_id', campaignId)

  if (error) {
    console.error('deleteScene error:', error)
    return { error: 'Не удалось удалить' }
  }

  revalidatePath(`/campaign/${campaignId}/scenes`)
  return { success: true }
}

export async function setActiveScene(sceneId: string, campaignId: string) {
  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Нет прав' }

  const supabase = await createClient()

  // Снимаем active со всех сцен кампании
  await supabase
    .from('scenes')
    .update({ is_active: false })
    .eq('campaign_id', campaignId)
    .eq('is_active', true)

  // Ставим active на выбранную
  const { error } = await supabase
    .from('scenes')
    .update({ is_active: true })
    .eq('id', sceneId)
    .eq('campaign_id', campaignId)

  if (error) {
    console.error('setActiveScene error:', error)
    return { error: 'Не удалось активировать' }
  }

  revalidatePath(`/campaign/${campaignId}/scenes`)
  revalidatePath(`/campaign/${campaignId}/scenes/${sceneId}`)
  return { success: true }
}

export async function uploadMap(sceneId: string, campaignId: string, file: File) {
  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Нет прав' }

  if (file.size > 10 * 1024 * 1024) {
    return { error: 'Файл больше 10 MB' }
  }

  const supabase = await createClient()
  const ext = file.name.split('.').pop() ?? 'png'
  const fileName = `${campaignId}/${sceneId}-${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('scene-maps')
    .upload(fileName, file, { upsert: true })

  if (uploadError) {
    console.error('uploadMap error:', uploadError)
    return { error: 'Не удалось загрузить' }
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('scene-maps').getPublicUrl(fileName)

  const { error } = await supabase
    .from('scenes')
    .update({ image_url: publicUrl })
    .eq('id', sceneId)
    .eq('campaign_id', campaignId)

  if (error) {
    return { error: 'Не удалось сохранить URL' }
  }

  revalidatePath(`/campaign/${campaignId}/scenes/${sceneId}`)
  return { success: true, url: publicUrl }
}
