export const instant = false

import { connection } from 'next/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCampaignAccess } from '@/lib/queries/access'
import { getBacklinksCounts } from '@/lib/queries/backlinks'
import { getTemplatesForCampaign } from '@/lib/queries/templates'
import { Users } from 'lucide-react'
import CreateEntityButton from './create-entity-button'
import EntityCard from './entity-card'
import { EmptyState } from '@/components/ui'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { ENTITY_FILTERS, ENTITY_STYLES } from '@/lib/entity-ui'
import { cn } from '@/lib/utils'
import { getLang } from '@/lib/i18n/get-lang'
import { createT, getDictionary } from '@/lib/i18n/dictionaries'
import { pluralize } from '@/lib/i18n/plural'
import type { Entity, EntityType } from '@/lib/types'

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

  let query = supabase
    .from('entities')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('updated_at', { ascending: false })

  const validTypes: EntityType[] = [
    'npc',
    'location',
    'item',
    'monster',
    'faction',
    'quest',
    'note',
  ]

  if (typeFilter && validTypes.includes(typeFilter as EntityType)) {
    query = query.eq('type', typeFilter)
  }

  const [entitiesRes, backlinksCounts, templates] = await Promise.all([
    query,
    getBacklinksCounts(campaignId),
    getTemplatesForCampaign(campaignId),
  ])

  if (entitiesRes.error) {
    console.error('entities query error:', entitiesRes.error)
  }

  const entities = (entitiesRes.data ?? []) as Entity[]

  const activeType = typeFilter ?? 'all'
  const base = `/campaign/${campaignId}/entities`

  const countLabel = pluralize(lang, entities.length, {
    one: t('entities.count.one'),
    few: t('entities.count.few'),
    many: t('entities.count.many'),
  })

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

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-[var(--text-primary)]">
            <Users size={22} className="text-[var(--success)]" />
            {t('nav.entities')}
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {entities.length} {countLabel}
            {!isDm && ` · ${t('entities.onlyVisible')}`}
          </p>
        </div>
        {isDm && <CreateEntityButton campaignId={campaignId} templates={templates} />}
      </div>

      {/* Фильтры по типу */}
      <div className="mb-6 flex flex-wrap gap-2">
        {ENTITY_FILTERS.map((f) => {
          const isActive = activeType === f.value
          const href = f.value === 'all' ? base : `${base}?type=${f.value}`
          const label = f.value === 'all' ? t('common.all') : t(ENTITY_STYLES[f.value].labelKey)
          const icon = f.value === 'all' ? null : ENTITY_STYLES[f.value].icon

          return (
            <Link
              key={f.value}
              href={href}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-sm transition-colors',
                isActive
                  ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                  : 'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:border-[var(--border-hover)] hover:text-[var(--text-primary)]'
              )}
            >
              {icon && <span className="mr-1">{icon}</span>}
              {label}
            </Link>
          )
        })}
      </div>

      {entities.length === 0 ? (
        <EmptyState
          icon="👥"
          title={
            activeType === 'all' ? t('entities.empty.titleAll') : t('entities.empty.titleType')
          }
          description={
            isDm ? t('entities.empty.descriptionDm') : t('entities.empty.descriptionPlayer')
          }
          size="lg"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {entities.map((e) => (
            <EntityCard
              key={e.id}
              entity={e}
              campaignId={campaignId}
              isDm={isDm}
              backlinksCount={backlinksCounts[e.id] ?? 0}
            />
          ))}
        </div>
      )}
    </div>
  )
}
