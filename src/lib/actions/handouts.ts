'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCampaignAccess } from '@/lib/queries/access'
import { logEvent } from './logs'

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
  if (!file.type.startsWith('image/')) return { error: 'Можно загружать только изображения' }

  const supabase = await createClient()
  const ext = file.name.split('.').pop() ?? 'png'
  const fileName = `${campaignId}/${Date.now()}-${name.replace(/\s+/g, '-').toLowerCase()}.${ext}`

  const { error: uploadError } = await supabase.storage.from('handouts').upload(fileName, file)
  if (uploadError) return { error: 'Не удалось загрузить' }

  const {
    data: { publicUrl },
  } = supabase.storage.from('handouts').getPublicUrl(fileName)

  const { error } = await supabase.from('handouts').insert({
    campaign_id: campaignId,
    name,
    image_url: publicUrl,
  })

  if (error) return { error: 'Не удалось создать' }

  await logEvent(campaignId, 'handout_create', `Создан хендаут: ${name}`)

  revalidatePath(`/campaign/${campaignId}`)
  return { success: true }
}

export async function showHandout(handoutId: string, campaignId: string) {
  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Нет прав' }

  const supabase = await createClient()

  await supabase
    .from('handouts')
    .update({ is_visible: false })
    .eq('campaign_id', campaignId)
    .eq('is_visible', true)

  const { data: handout, error } = await supabase
    .from('handouts')
    .update({ is_visible: true })
    .eq('id', handoutId)
    .eq('campaign_id', campaignId)
    .select('name')
    .maybeSingle()

  if (error || !handout) return { error: 'Не удалось показать' }

  await logEvent(campaignId, 'handout_show', `Показан хендаут: ${handout?.name ?? '?'}`)

  revalidatePath(`/campaign/${campaignId}`)
  return { success: true }
}

export async function hideHandout(handoutId: string, campaignId: string) {
  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Нет прав' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('handouts')
    .update({ is_visible: false })
    .eq('id', handoutId)
    .eq('campaign_id', campaignId)
    .select('id')
    .maybeSingle()
  if (error || !data) return { error: 'Не удалось скрыть' }

  revalidatePath(`/campaign/${campaignId}`)
  return { success: true }
}

export async function deleteHandout(handoutId: string, campaignId: string) {
  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Нет прав' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('handouts')
    .delete()
    .eq('id', handoutId)
    .eq('campaign_id', campaignId)
    .select('id')
    .maybeSingle()
  if (error || !data) return { error: 'Не удалось удалить' }

  revalidatePath(`/campaign/${campaignId}`)
  return { success: true }
}
