import { createClient } from '@/lib/supabase/server'
import type { EntityTemplate, EntityType } from '@/lib/types'

/**
 * Возвращает шаблоны для кампании: встроенные + пользовательские.
 * Если указан type — фильтрует по типу.
 */
export async function getTemplates(
  campaignId: string,
  type?: EntityType
): Promise<EntityTemplate[]> {
  const supabase = await createClient()

  let query = supabase
    .from('entity_templates')
    .select('*')
    .or(`is_builtin.eq.true,campaign_id.eq.${campaignId}`)
    .order('is_builtin', { ascending: false })
    .order('name')

  if (type) {
    query = query.eq('type', type)
  }

  const { data, error } = await query

  if (error) {
    console.error('getTemplates error:', error)
    return []
  }

  return (data ?? []).map(mapTemplate)
}

export async function getTemplatesForCampaign(campaignId: string): Promise<EntityTemplate[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('entity_templates')
    .select('*')
    .or(`is_builtin.eq.true,campaign_id.eq.${campaignId}`)
    .order('type')
    .order('is_builtin', { ascending: false })
    .order('name')

  if (error) {
    console.error('getTemplatesForCampaign error:', error)
    return []
  }

  return (data ?? []).map(mapTemplate)
}

function mapTemplate(row: Record<string, unknown>): EntityTemplate {
  return {
    id: row.id as string,
    campaignId: (row.campaign_id as string) ?? null,
    type: row.type as EntityType,
    name: row.name as string,
    description: (row.description as string) ?? '',
    dataJson: (row.data_json as Record<string, unknown>) ?? {},
    icon: (row.icon as string) ?? null,
    isBuiltin: Boolean(row.is_builtin),
    createdAt: row.created_at as string,
  }
}
