import { createClient } from '@/lib/supabase/server'
import type { CampaignStats } from '@/lib/types'

export async function getCampaignStats(
  campaignId: string
): Promise<CampaignStats | null> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_campaign_stats', {
    p_campaign_id: campaignId,
  })

  if (error) {
    console.error('getCampaignStats error:', error)
    return null
  }

  return data as CampaignStats
}