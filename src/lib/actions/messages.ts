'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCampaignAccess } from '@/lib/queries/access'
import type { MessageType, MessageMetadata } from '@/lib/types'

export async function sendMessage(
  campaignId: string,
  content: string,
  type: MessageType = 'text',
  metadata: MessageMetadata = {}
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Не авторизован' }

  const { isMember } = await getCampaignAccess(campaignId)
  if (!isMember) return { error: 'Нет доступа' }

  const trimmed = content.trim()
  if (!trimmed) return { error: 'Пустое сообщение' }
  if (trimmed.length > 5000) return { error: 'Слишком длинное' }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      campaign_id: campaignId,
      user_id: user.id,
      content: trimmed,
      type,
      metadata,
    })
    .select('id')
    .single()

  if (error) {
    console.error('sendMessage error:', error)
    return { error: 'Не удалось отправить' }
  }

  revalidatePath(`/campaign/${campaignId}`)
  return { success: true, messageId: data.id }
}

export async function deleteMessage(messageId: string, campaignId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Не авторизован' }

  const { isDm } = await getCampaignAccess(campaignId)

  const { data: message } = await supabase
    .from('messages')
    .select('user_id')
    .eq('id', messageId)
    .eq('campaign_id', campaignId)
    .single()

  if (!message) return { error: 'Сообщение не найдено' }

  const isAuthor = message.user_id === user.id

  if (!isAuthor && !isDm) {
    return { error: 'Нет прав' }
  }

  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId)
    .eq('campaign_id', campaignId)

  if (error) {
    console.error('deleteMessage error:', error)
    return { error: 'Не удалось удалить' }
  }

  revalidatePath(`/campaign/${campaignId}`)
  return { success: true }
}
