'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCampaignAccess } from '@/lib/queries/access'

export async function updateChapterContent(
  chapterId: string,
  campaignId: string,
  content_md: string
) {
  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Нет прав' }

  if (content_md.length > 500_000) {
    return { error: 'Слишком длинный текст (макс. 500к символов)' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('chapters')
    .update({ content_md })
    .eq('id', chapterId)
    .eq('campaign_id', campaignId)

  if (error) {
    console.error('updateChapterContent error:', error)
    return { error: 'Не удалось сохранить' }
  }

  revalidatePath(`/campaign/${campaignId}/chapters/${chapterId}`)
  return { success: true, savedAt: new Date().toISOString() }
}