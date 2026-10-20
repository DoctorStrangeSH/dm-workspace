'use server'

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

  const { error } = await supabase
    .from('campaigns')
    .delete()
    .eq('id', campaignId)
    .eq('owner_id', user.id)

  if (error) {
    console.error('deleteCampaign error:', error)
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

  // Генерим новый код в стиле БД: 8 символов из md5
  const newCode = Math.random().toString(36).substring(2, 10)

  const { error } = await supabase
    .from('campaigns')
    .update({ invite_code: newCode })
    .eq('id', campaignId)
    .eq('owner_id', user.id)

  if (error) {
    console.error('regenerateInviteCode error:', error)
    return { error: 'Не удалось обновить код' }
  }

  revalidatePath('/dashboard')
  return { success: true, inviteCode: newCode }
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
