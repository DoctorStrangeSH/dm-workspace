import { createClient } from '@/lib/supabase/server'
import type { MessageWithAuthor } from '@/lib/types'

/**
 * Возвращает последние сообщения кампании.
 */
export async function getCampaignMessages(
  campaignId: string,
  limit = 50
): Promise<MessageWithAuthor[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('messages')
    .select(
      `
      *,
      author:profiles (
        id,
        username,
        display_name,
        avatar_url
      )
    `
    )
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('getCampaignMessages error:', error)
    return []
  }

  return (data ?? [])
    .map((row) => {
      const author = Array.isArray(row.author) ? row.author[0] : row.author
      return {
        ...row,
        author,
      } as MessageWithAuthor
    })
    .reverse()
}