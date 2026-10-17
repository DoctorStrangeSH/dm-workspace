import { createClient } from '@/lib/supabase/server'
import type {
  EntityType,
  EntityRelation,
  RelationType,
  EntityTag,
  Tag,
} from '@/lib/types'

export interface BacklinkChapter {
  chapterId: string
  chapterTitle: string
  chapterUpdatedAt: string
  snippets: string[]
}

export interface ChapterEntity {
  entityId: string
  entityName: string
  entityType: EntityType
}

// ============================================================
// Беклинки
// ============================================================

/**
 * Находит все главы кампании, где упоминается сущность [[Name]].
 */
export async function getEntityBacklinks(
  entityId: string
): Promise<BacklinkChapter[]> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('find_entity_backlinks', {
    p_entity_id: entityId,
  })

  if (error) {
    console.error('getEntityBacklinks error:', error)
    return []
  }

  return (data ?? []).map((row) => ({
    chapterId: row.chapter_id,
    chapterTitle: row.chapter_title,
    chapterUpdatedAt: row.chapter_updated_at,
    snippets: row.snippets ?? [],
  }))
}

/**
 * Находит все сущности, упомянутые в главе.
 */
export async function getChapterEntities(
  chapterId: string
): Promise<ChapterEntity[]> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_chapter_entities', {
    p_chapter_id: chapterId,
  })

  if (error) {
    console.error('getChapterEntities error:', error)
    return []
  }

  return (data ?? []).map((row) => ({
    entityId: row.entity_id,
    entityName: row.entity_name,
    entityType: row.entity_type as EntityType,
  }))
}

/**
 * Возвращает количество упоминаний сущности в кампании.
 */
export async function getEntityBacklinksCount(
  entityId: string
): Promise<number> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('find_entity_backlinks', {
    p_entity_id: entityId,
  })

  if (error) return 0
  return (data ?? []).length
}

/**
 * Возвращает карту: entity_id → количество упоминаний в главах.
 */
export async function getBacklinksCounts(
  campaignId: string
): Promise<Record<string, number>> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('count_entity_backlinks', {
    p_campaign_id: campaignId,
  })

  if (error) {
    console.error('getBacklinksCounts error:', error)
    return {}
  }

  const map: Record<string, number> = {}
  for (const row of data ?? []) {
    map[row.entity_id] = Number(row.backlinks_count)
  }
  return map
}

// ============================================================
// Связи
// ============================================================

/**
 * Возвращает все связи сущности (входящие и исходящие).
 */
export async function getEntityRelations(
  entityId: string
): Promise<EntityRelation[]> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_entity_relations', {
    p_entity_id: entityId,
  })

  if (error) {
    console.error('getEntityRelations error:', error)
    return []
  }

  return (data ?? []).map((row) => ({
    relationId: row.relation_id,
    direction: row.direction as 'outgoing' | 'incoming',
    relationType: row.relation_type as RelationType,
    sourceId: row.source_id,
    sourceName: row.source_name,
    sourceType: row.source_type as EntityType,
    targetId: row.target_id,
    targetName: row.target_name,
    targetType: row.target_type as EntityType,
    metadata: row.metadata ?? {},
  }))
}

// ============================================================
// Теги
// ============================================================

/**
 * Возвращает все теги сущности.
 */
export async function getEntityTags(
  entityId: string
): Promise<EntityTag[]> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_entity_tags', {
    p_entity_id: entityId,
  })

  if (error) {
    console.error('getEntityTags error:', error)
    return []
  }

  return (data ?? []).map((row) => ({
    id: row.tag_id,
    name: row.tag_name,
    color: row.tag_color,
  }))
}

/**
 * Возвращает все теги кампании с количеством сущностей.
 */
export async function getCampaignTags(
  campaignId: string
): Promise<Tag[]> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_campaign_tags', {
    p_campaign_id: campaignId,
  })

  if (error) {
    console.error('getCampaignTags error:', error)
    return []
  }

  return (data ?? []).map((row) => ({
    id: row.tag_id,
    name: row.tag_name,
    color: row.tag_color,
    entitiesCount: Number(row.entities_count),
  }))
}

/**
 * Возвращает карту: entity_id → массив тегов.
 */
export async function getEntitiesTagsMap(
  campaignId: string
): Promise<Record<string, EntityTag[]>> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_entities_tags_map', {
    p_campaign_id: campaignId,
  })

  if (error) {
    console.error('getEntitiesTagsMap error:', error)
    return {}
  }

  const map: Record<string, EntityTag[]> = {}
  for (const row of data ?? []) {
    map[row.entity_id] = row.tags ?? []
  }
  return map
}

/**
 * Возвращает всех дочерних локаций (рекурсивно).
 */
export async function getLocationDescendants(
  entityId: string
): Promise<Array<{ entityId: string; entityName: string; depth: number }>> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_location_descendants', {
    p_root_id: entityId,
  })

  if (error) {
    console.error('getLocationDescendants error:', error)
    return []
  }

  return (data ?? []).map((row) => ({
    entityId: row.entity_id,
    entityName: row.entity_name,
    depth: row.depth,
  }))
}

/**
 * Возвращает путь от корня до сущности (цепочку родителей).
 */
export async function getLocationPath(
  entityId: string
): Promise<
  Array<{
    entityId: string
    entityName: string
    entityType: EntityType
    depth: number
  }>
> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_location_path', {
    p_entity_id: entityId,
  })

  if (error) {
    console.error('getLocationPath error:', error)
    return []
  }

  return (data ?? []).map((row) => ({
    entityId: row.entity_id,
    entityName: row.entity_name,
    entityType: row.entity_type as EntityType,
    depth: row.depth,
  }))
}