import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { SummonRequestWithRequester } from '@/lib/types'

export async function getPendingSummonRequests(
  campaignId: string
): Promise<SummonRequestWithRequester[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('summon_requests')
    .select(
      `
      *,
      requester:profiles!summon_requests_requester_id_fkey(id, username, display_name)
    `
    )
    .eq('campaign_id', campaignId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('getPendingSummonRequests error:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    })
    return []
  }

  return (data ?? []) as SummonRequestWithRequester[]
}

export async function getRecentSummonRequests(
  campaignId: string,
  limit = 20
): Promise<SummonRequestWithRequester[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('summon_requests')
    .select(
      `
      *,
      requester:profiles!summon_requests_requester_id_fkey(id, username, display_name)
    `
    )
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('getRecentSummonRequests error:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    })
    return []
  }

  return (data ?? []) as SummonRequestWithRequester[]
}
