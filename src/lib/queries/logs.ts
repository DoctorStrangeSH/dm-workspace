import { createClient } from '@/lib/supabase/server'
import type { SessionLog } from '@/lib/types'

export interface SessionLogWithActor extends SessionLog {
  actor: {
    display_name: string | null
    username: string
  } | null
}

export async function getSessionLog(
  campaignId: string,
  limit = 100
): Promise<SessionLogWithActor[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('session_logs')
    .select(
      `
      *,
      actor:profiles (display_name, username)
    `
    )
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return []

  return (data ?? []).map((row) => {
    const actor = Array.isArray(row.actor) ? row.actor[0] : row.actor
    return { ...row, actor } as SessionLogWithActor
  })
}