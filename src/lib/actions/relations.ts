'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCampaignAccess } from '@/lib/queries/access'
import type { RelationType } from '@/lib/types'

const RELATION_TYPES: RelationType[] = [
  'member_of',
  'leader_of',
  'located_in',
  'owns',
  'quest_giver',
  'quest_target',
  'ally_of',
  'enemy_of',
  'parent_of',
  'related_to',
]

export async function createRelation(
  campaignId: string,
  sourceId: string,
  targetId: string,
  relationType: RelationType,
  metadata: Record<string, unknown> = {}
) {
  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Нет прав' }

  if (
    typeof sourceId !== 'string' ||
    typeof targetId !== 'string' ||
    !sourceId ||
    !targetId ||
    sourceId === targetId
  ) {
    return { error: 'Некорректные сущности для связи' }
  }

  if (typeof relationType !== 'string' || !RELATION_TYPES.includes(relationType)) {
    return { error: 'Некорректный тип связи' }
  }

  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return { error: 'Некорректные данные связи' }
  }

  let metadataJson: string
  try {
    metadataJson = JSON.stringify(metadata)
  } catch {
    return { error: 'Некорректные данные связи' }
  }
  if (metadataJson.length > 20_000) {
    return { error: 'Слишком большие данные связи' }
  }

  const supabase = await createClient()

  const { data: entities, error: entitiesError } = await supabase
    .from('entities')
    .select('id')
    .eq('campaign_id', campaignId)
    .in('id', [sourceId, targetId])

  if (entitiesError || !entities || entities.length !== 2) {
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
  if (typeof relationId !== 'string' || !relationId) {
    return { error: 'Некорректная связь' }
  }

  const supabase = await createClient()

  const { data: relation } = await supabase
    .from('entity_relations')
    .select('source_id, target_id')
    .eq('id', relationId)
    .eq('campaign_id', campaignId)
    .maybeSingle()

  if (!relation) return { error: 'Связь не найдена' }

  const { data: deleted, error } = await supabase
    .from('entity_relations')
    .delete()
    .eq('id', relationId)
    .eq('campaign_id', campaignId)
    .select('id')
    .maybeSingle()

  if (error || !deleted) {
    console.error('deleteRelation error:', error)
    return { error: 'Не удалось удалить связь' }
  }

  revalidatePath(`/campaign/${campaignId}/entities/${relation.source_id}`)
  revalidatePath(`/campaign/${campaignId}/entities/${relation.target_id}`)

  return { success: true }
}
