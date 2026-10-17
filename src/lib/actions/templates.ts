'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCampaignAccess } from '@/lib/queries/access'
import type { EntityType } from '@/lib/types'

export async function createTemplateFromEntity(
  entityId: string,
  campaignId: string,
  templateName: string
) {
  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Нет прав' }

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
    .single()

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

  if (error) {
    console.error('createTemplateFromEntity error:', error)
    return { error: 'Не удалось создать шаблон' }
  }

  revalidatePath(`/campaign/${campaignId}/templates`)
  return { success: true, templateId: data.id }
}

export async function deleteTemplate(
  templateId: string,
  campaignId: string
) {
  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Нет прав' }

  const supabase = await createClient()

  const { error } = await supabase
    .from('entity_templates')
    .delete()
    .eq('id', templateId)
    .eq('campaign_id', campaignId)
    .eq('is_builtin', false)

  if (error) {
    console.error('deleteTemplate error:', error)
    return { error: 'Не удалось удалить шаблон' }
  }

  revalidatePath(`/campaign/${campaignId}/templates`)
  return { success: true }
}