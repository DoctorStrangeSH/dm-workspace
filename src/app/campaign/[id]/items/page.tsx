export const instant = false

import { connection } from 'next/server'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCampaignAccess } from '@/lib/queries/access'
import {
  searchSrdItemsAction,
  getAvailableItemTypes,
  getAvailableRarities,
} from '@/lib/actions/items-search'
import { Breadcrumbs } from '@/components/breadcrumbs'
import ItemsClient from './items-client'

export default async function ItemsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await connection()

  const { id: campaignId } = await params
  const { campaign, isDm, isMember } = await getCampaignAccess(campaignId)

  if (!campaign) notFound()
  if (!isMember) redirect('/dashboard')

  const [initialItems, availableTypes, availableRarities] = await Promise.all([
    searchSrdItemsAction({ limit: 100 }),
    getAvailableItemTypes(),
    getAvailableRarities(),
  ])

  // Персонажи игрока для добавления
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let characters: Array<{ id: string; name: string }> = []
  if (user) {
    const { data } = await supabase
      .from('characters')
      .select('id, name')
      .eq('campaign_id', campaignId)
      .eq('user_id', user.id)
      .eq('is_active', true)
    characters = data ?? []
  }

  return (
    <div className="max-w-6xl">
      <Breadcrumbs
        items={[
          { label: 'Дашборд', href: '/dashboard' },
          { label: campaign.name, href: `/campaign/${campaignId}` },
          { label: 'Предметы' },
        ]}
        className="mb-4"
      />

      <div className="mb-6">
        <h1 className="text-2xl font-bold">Справочник предметов</h1>
        <p className="text-slate-400 text-sm mt-1">
          Поиск предметов из SRD 2024.
        </p>
      </div>

      <ItemsClient
        campaignId={campaignId}
        initialItems={initialItems}
        characters={characters}
        availableTypes={availableTypes}
        availableRarities={availableRarities}
        canEditCampaign={isDm}
      />
    </div>
  )
}