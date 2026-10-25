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

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { error: 'Некорректные данные сессии' }
  }
  if (typeof data.title !== 'string' || typeof data.startsAt !== 'string') {
    return { error: 'Укажите название и дату сессии' }
  }
  const trimmedTitle = data.title.trim()
  if (!trimmedTitle) return { error: 'Введите название' }
  if (trimmedTitle.length > 150) return { error: 'Название слишком длинное' }
  if (data.description !== undefined && typeof data.description !== 'string') {
    return { error: 'Некорректное описание' }
  }
  if (data.description && data.description.length > 5000) {
    return { error: 'Описание слишком длинное' }
  }
  if (!Number.isFinite(Date.parse(data.startsAt))) return { error: 'Некорректная дата сессии' }
  const duration = data.durationMinutes ?? 180
  if (!Number.isInteger(duration) || duration < 15 || duration > 1440) {
    return { error: 'Длительность должна быть от 15 минут до 24 часов' }
  }

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
    duration_minutes: duration,
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
  const { data, error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', sessionId)
    .eq('campaign_id', campaignId)
    .select('id')
    .maybeSingle()

  if (error || !data) return { error: 'Не удалось удалить' }

  revalidatePath(`/campaign/${campaignId}/sessions`)
  return { success: true }
}

export async function setRsvp(sessionId: string, status: RsvpStatus) {
  if (status !== 'yes' && status !== 'no' && status !== 'maybe') {
    return { error: 'Некорректный ответ на приглашение' }
  }

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

  const { isMember } = await getCampaignAccess(session.campaign_id)
  if (!isMember) return { error: 'Нет доступа к кампании' }

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
