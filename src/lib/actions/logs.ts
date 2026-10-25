'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCampaignAccess } from '@/lib/queries/access'

export async function logEvent(
  campaignId: string,
  eventType: string,
  description: string,
  metadata: Record<string, unknown> = {}
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Не авторизован' }

  // Server actions are directly callable; never trust the client to be a campaign member.
  const { isMember } = await getCampaignAccess(campaignId)
  if (!isMember) return { error: 'Нет доступа к кампании' }

  const normalizedType = eventType.trim()
  const normalizedDescription = description.trim()
  if (!normalizedType || normalizedType.length > 80) {
    return { error: 'Некорректный тип события' }
  }
  if (!normalizedDescription || normalizedDescription.length > 500) {
    return { error: 'Некорректное описание события' }
  }
  if (JSON.stringify(metadata).length > 20_000) {
    return { error: 'Слишком большие данные события' }
  }

  const { error } = await supabase.from('session_logs').insert({
    campaign_id: campaignId,
    actor_id: user.id,
    event_type: normalizedType,
    description: normalizedDescription,
    metadata,
  })

  if (error) {
    console.error('logEvent error:', error)
    return { error: 'Не удалось записать' }
  }

  revalidatePath(`/campaign/${campaignId}`)
  return { success: true }
}

export async function clearLog(campaignId: string) {
  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Нет прав' }

  const supabase = await createClient()
  const { error } = await supabase.from('session_logs').delete().eq('campaign_id', campaignId)

  if (error) return { error: 'Не удалось очистить' }

  revalidatePath(`/campaign/${campaignId}`)
  return { success: true }
}
