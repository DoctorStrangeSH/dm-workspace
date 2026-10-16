import { createClient } from '@/lib/supabase/server'
import type { EntityType } from '@/lib/types'

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
 * Один запрос на всю кампанию — эффективно.
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