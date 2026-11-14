export const instant = false

import { connection } from 'next/server'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCampaignAccess } from '@/lib/queries/access'
import { getBacklinksCounts } from '@/lib/queries/backlinks'
import { getTemplatesForCampaign } from '@/lib/queries/templates'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { ENTITY_FILTERS } from '@/lib/entity-ui'
import { getLang } from '@/lib/i18n/get-lang'
import { createT, getDictionary } from '@/lib/i18n/dictionaries'
import EntitiesWorkspace from './entities-workspace'
import type { EntityCardData } from './entity-card'
import { toEntityLibraryCard, type QuestLibraryRow } from '@/lib/quest-journal'

export default async function EntitiesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ type?: string }>
}) {
  await connection()
  const lang = await getLang()
  const t = createT(getDictionary(lang))
  const { id: campaignId } = await params
  const { type: typeFilter } = await searchParams
  const { campaign, isDm, isMember } = await getCampaignAccess(campaignId)
  if (!campaign) notFound()
  if (!isMember) redirect('/dashboard')

  const supabase = await createClient()
  // Fetch only card fields. Secret/stat payloads are not needed by the library.
  let query = supabase
    .from('entities')
    .select(
      'id,type,name,description,is_visible_to_players,updated_at,quest_status:data_json->status,quest_giver:data_json->giver,quest_reward:data_json->reward,quest_location:data_json->location,quest_objectives:data_json->objectives',
      { count: 'exact' }
    )
    .eq('campaign_id', campaignId)
    .order('updated_at', { ascending: false })
    .order('id')
  if (!isDm) query = query.eq('is_visible_to_players', true)

  async function readLibrary() {
    const rows: EntityCardData[] = []
    for (;;) {
      const { data, error, count } = await query.range(rows.length, rows.length + 499)
      if (error) {
        console.error('entities query error:', error.code)
        throw new Error('Unable to load entity library')
      }
      if (!data?.length) return rows
      rows.push(...(data as unknown as QuestLibraryRow[]).map(toEntityLibraryCard))
      if (count !== null ? rows.length >= count : data.length < 500) return rows
    }
  }
  const [entities, backlinksCounts, templates] = await Promise.all([
    readLibrary(),
    getBacklinksCounts(campaignId),
    isDm ? getTemplatesForCampaign(campaignId) : Promise.resolve([]),
  ])
  const initialType = ENTITY_FILTERS.find(({ value }) => value === typeFilter)?.value ?? 'all'
  return (
    <div className="max-w-6xl">
      <Breadcrumbs
        items={[
          { label: t('nav.dashboard'), href: '/dashboard' },
          { label: campaign.name, href: `/campaign/${campaignId}` },
          { label: t('nav.entities') },
        ]}
        className="mb-4"
      />
      <EntitiesWorkspace
        key={`${campaignId}:${initialType}`}
        campaignId={campaignId}
        initialType={initialType}
        entities={entities}
        backlinksCounts={Object.fromEntries(
          entities.map((entity) => [entity.id, backlinksCounts[entity.id] ?? 0])
        )}
        templates={templates}
        isDm={isDm}
      />
    </div>
  )
}
