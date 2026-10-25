'use server'

import { randomInt } from 'node:crypto'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createCampaign(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Не авторизован' }
  }

  const name = (formData.get('name') as string)?.trim()
  const genre = (formData.get('genre') as string)?.trim() || null
  const description = (formData.get('description') as string)?.trim() || null

  if (!name || name.length < 2) {
    return { error: 'Название должно быть минимум 2 символа' }
  }

  if (name.length > 100) {
    return { error: 'Название слишком длинное (макс. 100)' }
  }

  const { data, error } = await supabase
    .from('campaigns')
    .insert({
      name,
      genre,
      description,
      owner_id: user.id,
    })
    .select('id')
    .single()

  if (error) {
    console.error('createCampaign error:', error)
    return { error: 'Не удалось создать кампанию' }
  }

  revalidatePath('/dashboard')
  return { success: true, campaignId: data.id }
}

export async function deleteCampaign(campaignId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Не авторизован' }

  const { data, error } = await supabase
    .from('campaigns')
    .delete()
    .eq('id', campaignId)
    .eq('owner_id', user.id)
    .select('id')
    .maybeSingle()

  if (error || !data) {
    if (error) console.error('deleteCampaign error:', error)
    return { error: 'Не удалось удалить кампанию' }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function regenerateInviteCode(campaignId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Не авторизован' }

  // Keep the existing eight-character format while using a cryptographically secure RNG.
  const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz'
  const newCode = Array.from({ length: 8 }, () => alphabet[randomInt(alphabet.length)]).join('')

  const { data, error } = await supabase
    .from('campaigns')
    .update({ invite_code: newCode })
    .eq('id', campaignId)
    .eq('owner_id', user.id)
    .select('invite_code')
    .maybeSingle()

  if (error || !data) {
    if (error) console.error('regenerateInviteCode error:', error)
    return { error: 'Не удалось обновить код' }
  }

  revalidatePath('/dashboard')
  return { success: true, inviteCode: data.invite_code }
}

export async function joinCampaign(code: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Не авторизован' }

  const { data, error } = await supabase.rpc('join_campaign_by_code', {
    code,
  })

  if (error) {
    console.error('joinCampaign error:', error)
    return { error: 'Неверный код приглашения' }
  }

  return { success: true, campaignId: data }
}
