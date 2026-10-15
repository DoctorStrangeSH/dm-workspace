import { createClient } from '@/lib/supabase/server'
import type { CampaignRole } from '@/lib/types'

interface CampaignAccess {
  campaign: {
    id: string
    name: string
    genre: string | null
    description: string | null
    owner_id: string
    invite_code: string
    created_at: string
    updated_at: string
  } | null
  role: CampaignRole | null
  isDm: boolean
  isMember: boolean
}

/**
 * Проверяет доступ текущего пользователя к кампании.
 * Возвращает кампанию + роль или null-ы, если доступа нет.
 */
export async function getCampaignAccess(
  campaignId: string
): Promise<CampaignAccess> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { campaign: null, role: null, isDm: false, isMember: false }
  }

  // Получаем кампанию
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .single()

  if (!campaign) {
    return { campaign: null, role: null, isDm: false, isMember: false }
  }

  // Получаем роль пользователя в кампании
  const { data: membership } = await supabase
    .from('campaign_members')
    .select('role')
    .eq('campaign_id', campaignId)
    .eq('user_id', user.id)
    .single()

  const role = (membership?.role as CampaignRole | undefined) ?? null

  return {
    campaign,
    role,
    isDm: role === 'dm',
    isMember: role !== null,
  }
}