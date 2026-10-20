'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCampaignAccess } from '@/lib/queries/access'
import type { RelationType } from '@/lib/types'

export async function createRelation(
  campaignId: string,
  sourceId: string,
  targetId: string,
  relationType: RelationType,
  metadata: Record<string, unknown> = {}
) {
  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Нет прав' }

  if (sourceId === targetId) {
    return { error: 'Нельзя связать сущность с самой собой' }
  }

  const supabase = await createClient()

  // Проверяем, что обе сущности принадлежат кампании
  const { data: entities } = await supabase
    .from('entities')
    .select('id')
    .eq('campaign_id', campaignId)
    .in('id', [sourceId, targetId])

  if (!entities || entities.length !== 2) {
    return { error: 'Сущности не найдены' }
  }

  const { data, error } = await supabase
    .from('entity_relations')
    .insert({
      campaign_id: campaignId,
      source_id: sourceId,
      target_id: targetId,
      relation_type: relationType,
      metadata,
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') {
      return { error: 'Такая связь уже существует' }
    }
    console.error('createRelation error:', error)
    return { error: 'Не удалось создать связь' }
  }

  revalidatePath(`/campaign/${campaignId}/entities/${sourceId}`)
  revalidatePath(`/campaign/${campaignId}/entities/${targetId}`)

  return { success: true, relationId: data.id }
}

export async function deleteRelation(relationId: string, campaignId: string) {
  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Нет прав' }

  const supabase = await createClient()

  const { data: relation } = await supabase
    .from('entity_relations')
    .select('source_id, target_id')
    .eq('id', relationId)
    .eq('campaign_id', campaignId)
    .single()

  if (!relation) return { error: 'Связь не найдена' }

  const { error } = await supabase
    .from('entity_relations')
    .delete()
    .eq('id', relationId)
    .eq('campaign_id', campaignId)

  if (error) {
    console.error('deleteRelation error:', error)
    return { error: 'Не удалось удалить связь' }
  }

  revalidatePath(`/campaign/${campaignId}/entities/${relation.source_id}`)
  revalidatePath(`/campaign/${campaignId}/entities/${relation.target_id}`)

  return { success: true }
}
