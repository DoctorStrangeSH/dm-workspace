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

  if (typeof content !== 'string') return { error: 'Некорректное сообщение' }
  if (!['text', 'system', 'roll', 'combat'].includes(type)) return { error: 'Некорректный тип сообщения' }
  let metadataSize = 0
  try {
    metadataSize = JSON.stringify(metadata ?? {}).length
  } catch {
    return { error: 'Некорректные метаданные' }
  }
  if (metadataSize > 20_000) return { error: 'Метаданные слишком большие' }

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

  const { isDm, isMember } = await getCampaignAccess(campaignId)
  if (!isMember) return { error: 'Нет доступа' }

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

  const { data: deleted, error } = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId)
    .eq('campaign_id', campaignId)
    .select('id')
    .maybeSingle()

  if (error || !deleted) {
    console.error('deleteMessage error:', error)
    return { error: 'Не удалось удалить' }
  }

  revalidatePath(`/campaign/${campaignId}`)
  return { success: true }
}
