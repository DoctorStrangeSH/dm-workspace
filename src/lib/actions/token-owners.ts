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

  // The token and scene must both belong to the campaign supplied by the caller.
  const { data: scene } = await supabase
    .from('scenes')
    .select('id')
    .eq('id', sceneId)
    .eq('campaign_id', campaignId)
    .maybeSingle()
  if (!scene) return { error: 'Сцена не принадлежит кампании' }

  const { data: token } = await supabase
    .from('tokens')
    .select('id')
    .eq('id', tokenId)
    .eq('scene_id', sceneId)
    .eq('campaign_id', campaignId)
    .maybeSingle()
  if (!token) return { error: 'Токен не найден в этой сцене' }

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

  const { data: scene } = await supabase
    .from('scenes')
    .select('id')
    .eq('id', sceneId)
    .eq('campaign_id', campaignId)
    .maybeSingle()
  if (!scene) return { error: 'Сцена не принадлежит кампании' }

  const { data: token } = await supabase
    .from('tokens')
    .select('id')
    .eq('id', tokenId)
    .eq('scene_id', sceneId)
    .eq('campaign_id', campaignId)
    .maybeSingle()
  if (!token) return { error: 'Токен не найден в этой сцене' }

  const { data: removed, error } = await supabase
    .from('token_owners')
    .delete()
    .eq('token_id', tokenId)
    .eq('user_id', userId)
    .eq('campaign_id', campaignId)
    .select('token_id')
    .maybeSingle()

  if (error || !removed) {
    console.error('removeTokenOwner error:', { code: error?.code, message: error?.message })
    return { error: 'Не удалось удалить' }
  }

  revalidatePath(`/campaign/${campaignId}/scenes/${sceneId}`)
  return { success: true }
}
