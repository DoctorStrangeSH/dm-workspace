export const instant = false

import { connection } from 'next/server'
import { notFound, redirect } from 'next/navigation'
import { getCampaignAccess } from '@/lib/queries/access'
import { searchSrdItemsAction, getAvailableItemFilters } from '@/lib/actions/items-search'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumbs } from '@/components/breadcrumbs'
import ItemsClient from './items-client'
import { getLang } from '@/lib/i18n/get-lang'
import { createT, getDictionary } from '@/lib/i18n/dictionaries'

export default async function ItemsPage({ params }: { params: Promise<{ id: string }> }) {
  await connection()

  const lang = await getLang()
  const t = createT(getDictionary(lang))

  const { id: campaignId } = await params
  const { campaign, isDm, isMember } = await getCampaignAccess(campaignId)
  if (!campaign) notFound()
  if (!isMember) redirect('/dashboard')

  const supabase = await createClient()
  const { data: characters } = await supabase
    .from('characters')
    .select('id, name')
    .eq('campaign_id', campaignId)
    .eq('is_active', true)

  const [items, filters] = await Promise.all([
    searchSrdItemsAction({ limit: 100 }),
    getAvailableItemFilters(),
  ])

  return (
    <div className="max-w-6xl">
      <Breadcrumbs
        items={[
          { label: t('nav.dashboard'), href: '/dashboard' },
          { label: campaign.name, href: `/campaign/${campaignId}` },
          { label: t('nav.items') },
        ]}
        className="mb-4"
      />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">{t('nav.items')}</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">{t('items.subtitle')}</p>
      </div>

      <ItemsClient
        campaignId={campaignId}
        initialItems={items}
        characters={characters ?? []}
        availableTypes={filters.types}
        availableRarities={filters.rarities}
        canEditCampaign={isDm}
        lang={lang}
      />
    </div>
  )
}
