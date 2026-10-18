import { createClient } from '@/lib/supabase/server'
import type { CampaignWithRole, CampaignRole } from '@/lib/types'

export async function getUserCampaigns(userId: string): Promise<{
  asDm: CampaignWithRole[]
  asPlayer: CampaignWithRole[]
}> {
  const supabase = await createClient()

  // 1. Получаем членства (простой запрос, без вложенности)
  const { data: memberships, error: mErr } = await supabase
    .from('campaign_members')
    .select('campaign_id, role')
    .eq('user_id', userId)

  if (mErr) {
    console.error(
      'getUserCampaigns memberships error:',
      JSON.stringify(mErr, null, 2),
      'code:',
      mErr.code,
      'message:',
      mErr.message
    )
    return { asDm: [], asPlayer: [] }
  }

  if (!memberships || memberships.length === 0) {
    return { asDm: [], asPlayer: [] }
  }

  const campaignIds = memberships.map((m) => m.campaign_id)

  // 2. Получаем кампании отдельным запросом
  const { data: campaigns, error: cErr } = await supabase
    .from('campaigns')
    .select('*')
    .in('id', campaignIds)

  if (cErr) {
    console.error(
      'getUserCampaigns campaigns error:',
      JSON.stringify(cErr, null, 2),
      'code:',
      cErr.code,
      'message:',
      cErr.message
    )
    return { asDm: [], asPlayer: [] }
  }

  // 3. Склеиваем
  const asDm: CampaignWithRole[] = []
  const asPlayer: CampaignWithRole[] = []

  for (const campaign of campaigns ?? []) {
    const membership = memberships.find(
      (m) => m.campaign_id === campaign.id
    )
    if (!membership) continue

    const item: CampaignWithRole = {
      ...campaign,
      role: membership.role as CampaignRole,
    }

    if (membership.role === 'dm') asDm.push(item)
    else asPlayer.push(item)
  }

  // Сортируем по updated_at
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