import { createClient } from '@/lib/supabase/server'
import type { Handout } from '@/lib/types'

export async function getHandouts(campaignId: string): Promise<Handout[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('handouts')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false })

  return (data ?? []) as Handout[]
}

export async function getActiveHandout(
  campaignId: string
): Promise<Handout | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('handouts')
    .select('*')
    .eq('campaign_id', campaignId)
    .eq('is_visible', true)
    .maybeSingle()

  return (data as Handout) ?? null
}