'use server'

import { createClient } from '@/lib/supabase/server'
import { getCampaignAccess } from '@/lib/queries/access'

interface ChapterExportData {
  chapterTitle: string
  campaignName: string
  chapterContent: string
  updatedAt: string
  createdAt: string
}

/**
 * Возвращает данные главы для экспорта.
 */
export async function getChapterForExport(
  chapterId: string,
  campaignId: string
): Promise<{ data?: ChapterExportData; error?: string }> {
  const { campaign, isMember } = await getCampaignAccess(campaignId)

  if (!campaign) return { error: 'Кампания не найдена' }
  if (!isMember) return { error: 'Нет доступа' }

  const supabase = await createClient()

  const { data: chapter, error } = await supabase
    .from('chapters')
    .select('title, content_md, created_at, updated_at')
    .eq('id', chapterId)
    .eq('campaign_id', campaignId)
    .single()

  if (error || !chapter) {
    return { error: 'Глава не найдена' }
  }

  return {
    data: {
      chapterTitle: chapter.title,
      campaignName: campaign.name,
      chapterContent: chapter.content_md,
      updatedAt: chapter.updated_at,
      createdAt: chapter.created_at,
    },
  }
}

/**
 * Возвращает ВСЕ главы кампании для экспорта.
 * Сортировка по order_index.
 */
export async function getCampaignForExport(campaignId: string): Promise<{
  data?: {
    campaignName: string
    genre: string | null
    description: string | null
    chapters: Array<{
      title: string
      content_md: string
      order_index: number
      is_visible_to_players: boolean
      created_at: string
      updated_at: string
    }>
  }
  error?: string
}> {
  const { campaign, isDm, isMember } = await getCampaignAccess(campaignId)

  if (!campaign) return { error: 'Кампания не найдена' }
  if (!isMember) return { error: 'Нет доступа' }

  const supabase = await createClient()

  const { data: chapters, error } = await supabase
    .from('chapters')
    .select(
      'title, content_md, order_index, is_visible_to_players, created_at, updated_at'
    )
    .eq('campaign_id', campaignId)
    .order('order_index', { ascending: true })

  if (error) {
    console.error('getCampaignForExport error:', error)
    return { error: 'Не удалось загрузить главы' }
  }

  return {
    data: {
      campaignName: campaign.name,
      genre: campaign.genre,
      description: campaign.description,
      chapters: chapters ?? [],
    },
  }
}