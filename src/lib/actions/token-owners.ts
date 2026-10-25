'use server'

import { createClient } from '@/lib/supabase/server'
import { getCampaignAccess } from '@/lib/queries/access'
import { revalidatePath } from 'next/cache'

export async function addTokenOwner(
  tokenId: string,
  userId: string,
  campaignId: string,
  sceneId: string
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Только ГМ может добавлять владельцев' }

  // Проверяем, что user — участник кампании
  const { data: member } = await supabase
    .from('campaign_members')
    .select('user_id')
    .eq('campaign_id', campaignId)
    .eq('user_id', userId)
    .single()

  if (!member) return { error: 'Пользователь не участник кампании' }

  const { error } = await supabase
    .from('token_owners')
    .insert({ token_id: tokenId, user_id: userId, campaign_id: campaignId, added_by: user.id })

  if (error) {
    if (error.code === '23505') return { error: 'Уже владелец' }
    console.error('addTokenOwner error:', { code: error.code, message: error.message })
    return { error: 'Не удалось добавить' }
  }

  revalidatePath(`/campaign/${campaignId}/scenes/${sceneId}`)
  return { success: true }
}

export async function removeTokenOwner(
  tokenId: string,
  userId: string,
  campaignId: string,
  sceneId: string
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Только ГМ может убирать владельцев' }

  const { error } = await supabase
    .from('token_owners')
    .delete()
    .eq('token_id', tokenId)
    .eq('user_id', userId)
    .eq('campaign_id', campaignId)

  if (error) {
    console.error('removeTokenOwner error:', { code: error.code, message: error.message })
    return { error: 'Не удалось удалить' }
  }

  revalidatePath(`/campaign/${campaignId}/scenes/${sceneId}`)
  return { success: true }
}
