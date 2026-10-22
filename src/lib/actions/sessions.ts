'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCampaignAccess } from '@/lib/queries/access'
import type { RsvpStatus } from '@/lib/types'

export async function createSession(
  campaignId: string,
  data: {
    title: string
    description?: string
    startsAt: string
    durationMinutes?: number
  }
) {
  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Только ГМ' }

  const trimmedTitle = data.title.trim()
  if (!trimmedTitle) return { error: 'Введите название' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { error } = await supabase.from('sessions').insert({
    campaign_id: campaignId,
    title: trimmedTitle,
    description: data.description?.trim() || null,
    starts_at: data.startsAt,
    duration_minutes: data.durationMinutes ?? 180,
    created_by: user.id,
  })

  if (error) {
    console.error('createSession error:', error)
    return { error: 'Не удалось создать' }
  }

  revalidatePath(`/campaign/${campaignId}/sessions`)
  return { success: true }
}

export async function deleteSession(sessionId: string, campaignId: string) {
  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Только ГМ' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', sessionId)
    .eq('campaign_id', campaignId)

  if (error) return { error: 'Не удалось удалить' }

  revalidatePath(`/campaign/${campaignId}/sessions`)
  return { success: true }
}

export async function setRsvp(sessionId: string, status: RsvpStatus) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { data: session } = await supabase
    .from('sessions')
    .select('campaign_id')
    .eq('id', sessionId)
    .single()

  if (!session) return { error: 'Сессия не найдена' }

  const { error } = await supabase.from('session_rsvp').upsert(
    {
      session_id: sessionId,
      user_id: user.id,
      status,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'session_id,user_id' }
  )

  if (error) return { error: 'Не удалось обновить' }

  revalidatePath(`/campaign/${session.campaign_id}/sessions`)
  return { success: true }
}
