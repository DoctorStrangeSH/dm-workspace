import { createClient } from '@/lib/supabase/server'
import type { CampaignWithRole } from '@/lib/types'

export async function getUserCampaigns(userId: string): Promise<{
  asDm: CampaignWithRole[]
  asPlayer: CampaignWithRole[]
}> {
  const supabase = await createClient()

  // Получаем все членства пользователя с данными кампании
  const { data: memberships, error } = await supabase
    .from('campaign_members')
    .select(
      `
      role,
      campaign:campaigns (
        id, name, genre, description, owner_id, invite_code, created_at, updated_at
      )
    `
    )
    .eq('user_id', userId)

  if (error) {
    console.error('getUserCampaigns error:', error)
    return { asDm: [], asPlayer: [] }
  }

  const asDm: CampaignWithRole[] = []
  const asPlayer: CampaignWithRole[] = []

  for (const m of memberships ?? []) {
    const campaign = Array.isArray(m.campaign) ? m.campaign[0] : m.campaign
    if (!campaign) continue

    const item: CampaignWithRole = {
      ...campaign,
      role: m.role,
    }

    if (m.role === 'dm') asDm.push(item)
    else asPlayer.push(item)
  }

  // Сортируем по updated_at (свежие сверху)
  asDm.sort(
    (a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  )
  asPlayer.sort(
    (a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  )

  return { asDm, asPlayer }
}