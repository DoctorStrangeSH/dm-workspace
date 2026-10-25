'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCampaignAccess } from '@/lib/queries/access'

export async function createTemplateFromEntity(
  entityId: string,
  campaignId: string,
  templateName: string
) {
  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Нет прав' }

  if (typeof entityId !== 'string' || !entityId || typeof templateName !== 'string') {
    return { error: 'Некорректные данные шаблона' }
  }

  const name = templateName.trim()
  if (!name || name.length > 100) {
    return { error: 'Имя должно быть от 1 до 100 символов' }
  }

  const supabase = await createClient()

  const { data: entity, error: fetchError } = await supabase
    .from('entities')
    .select('type, description, data_json')
    .eq('id', entityId)
    .eq('campaign_id', campaignId)
    .maybeSingle()

  if (fetchError || !entity) {
    return { error: 'Сущность не найдена' }
  }

  const { data, error } = await supabase
    .from('entity_templates')
    .insert({
      campaign_id: campaignId,
      type: entity.type,
      name,
      description: entity.description ?? '',
      data_json: entity.data_json ?? {},
      is_builtin: false,
    })
    .select('id')
    .single()

  if (error || !data) {
    console.error('createTemplateFromEntity error:', error)
    return { error: 'Не удалось создать шаблон' }
  }

  revalidatePath(`/campaign/${campaignId}/templates`)
  return { success: true, templateId: data.id }
}

export async function deleteTemplate(templateId: string, campaignId: string) {
  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Нет прав' }
  if (typeof templateId !== 'string' || !templateId) {
    return { error: 'Некорректный шаблон' }
  }

  const supabase = await createClient()

  const { data: deleted, error } = await supabase
    .from('entity_templates')
    .delete()
    .eq('id', templateId)
    .eq('campaign_id', campaignId)
    .eq('is_builtin', false)
    .select('id')
    .maybeSingle()

  if (error || !deleted) {
    console.error('deleteTemplate error:', error)
    return { error: 'Не удалось удалить шаблон' }
  }

  revalidatePath(`/campaign/${campaignId}/templates`)
  return { success: true }
}
