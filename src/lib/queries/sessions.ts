import { createClient } from '@/lib/supabase/server'
import type { SessionWithRsvp } from '@/lib/types'

export async function getSessions(campaignId: string): Promise<SessionWithRsvp[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('sessions')
    .select(
      `
      *,
      rsvps:session_rsvp (*),
      creator:profiles!sessions_created_by_fkey (id, username, display_name)
    `
    )
    .eq('campaign_id', campaignId)
    .order('starts_at', { ascending: true })

  if (error) {
    console.error('getSessions error:', error)
    return []
  }

  return (data ?? []) as SessionWithRsvp[]
}
