'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCampaignAccess } from '@/lib/queries/access'
import { logEvent } from './logs'

function isCampaignStoragePath(path: string, campaignId: string): boolean {
  if (!/^[0-9a-f-]{36}$/i.test(campaignId)) return false
  const prefix = campaignId + '/'
  if (!path.startsWith(prefix)) return false
  const filename = path.slice(prefix.length)
  return /^[a-f0-9-]{36}\.(png|jpg|webp|gif|avif)$/i.test(filename)
}

export async function createHandout(campaignId: string, formData: FormData) {
  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Нет прав' }
  const rawName = formData.get('name')
  const rawFile = formData.get('image')
  const name = typeof rawName === 'string' ? rawName.trim() : ''
  const file = typeof File !== 'undefined' && rawFile instanceof File ? rawFile : null
  if (!name) return { error: 'Введите название' }
  if (name.length > 150) return { error: 'Название слишком длинное' }
  if (!file || file.size === 0) return { error: 'Выберите изображение' }
  if (file.size > 20 * 1024 * 1024) return { error: 'Файл > 20 MB' }
  const extByMime: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif' }
  const ext = extByMime[file.type]
  if (!ext) return { error: 'Поддерживаются PNG, JPEG, WebP, GIF и AVIF' }
  const supabase = await createClient()
  const fileName = campaignId + '/' + crypto.randomUUID() + '.' + ext
  const { error: uploadError } = await supabase.storage.from('handouts').upload(fileName, file)
  if (uploadError) return { error: 'Не удалось загрузить' }
  const { error } = await supabase.from('handouts').insert({ campaign_id: campaignId, name, image_url: fileName })
  if (error) {
    await supabase.storage.from('handouts').remove([fileName])
    return { error: 'Не удалось создать' }
  }
  await logEvent(campaignId, 'handout_create', 'Создан хендаут: ' + name)
  revalidatePath('/campaign/' + campaignId)
  return { success: true }
}

export async function showHandout(handoutId: string, campaignId: string) {
  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Нет прав' }
  const supabase = await createClient()
  const { data: target } = await supabase.from('handouts').select('id').eq('id', handoutId).eq('campaign_id', campaignId).maybeSingle()
  if (!target) return { error: 'Материал не найден' }
  await supabase.from('handouts').update({ is_visible: false }).eq('campaign_id', campaignId).eq('is_visible', true)
  const { data: handout, error } = await supabase.from('handouts').update({ is_visible: true }).eq('id', handoutId).eq('campaign_id', campaignId).select('name').maybeSingle()
  if (error || !handout) return { error: 'Не удалось показать' }
  await logEvent(campaignId, 'handout_show', 'Показан хендаут: ' + (handout.name ?? '?'))
  revalidatePath('/campaign/' + campaignId)
  return { success: true }
}

export async function hideHandout(handoutId: string, campaignId: string) {
  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Нет прав' }
  const supabase = await createClient()
  const { data, error } = await supabase.from('handouts').update({ is_visible: false }).eq('id', handoutId).eq('campaign_id', campaignId).select('id').maybeSingle()
  if (error || !data) return { error: 'Не удалось скрыть' }
  revalidatePath('/campaign/' + campaignId)
  return { success: true }
}

export async function deleteHandout(handoutId: string, campaignId: string) {
  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Нет прав' }
  const supabase = await createClient()
  const { data: handout, error: lookupError } = await supabase.from('handouts').select('id, image_url').eq('id', handoutId).eq('campaign_id', campaignId).maybeSingle()
  if (lookupError || !handout) return { error: 'Не удалось удалить' }
  const { error } = await supabase.from('handouts').delete().eq('id', handoutId).eq('campaign_id', campaignId)
  if (error) return { error: 'Не удалось удалить' }
  if (isCampaignStoragePath(handout.image_url, campaignId)) await supabase.storage.from('handouts').remove([handout.image_url])
  revalidatePath('/campaign/' + campaignId)
  return { success: true }
}
