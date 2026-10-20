export const instant = false

import { connection } from 'next/server'
import { notFound } from 'next/navigation'
import { getCampaignAccess } from '@/lib/queries/access'
import { getCampaignStats } from '@/lib/queries/stats'
import { Breadcrumbs } from '@/components/breadcrumbs'
import CampaignStatsGrid from './stats/campaign-stats-grid'
import EntitiesBreakdown from './stats/entities-breakdown'
import NeedsAttention from './stats/needs-attention'
import RecentActivity from './stats/recent-activity'
import { Crown } from 'lucide-react'
import { Badge, EmptyState } from '@/components/ui'

export default async function CampaignOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await connection()

  const { id } = await params
  const { campaign, isDm } = await getCampaignAccess(id)

  if (!campaign) notFound()

  const stats = await getCampaignStats(id)

  return (
    <div className="max-w-5xl">
      <Breadcrumbs
        items={[{ label: 'Дашборд', href: '/dashboard' }, { label: campaign.name }]}
        className="mb-4"
      />

      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-[var(--text-primary)]">{campaign.name}</h1>
        {campaign.genre && (
          <Badge variant="accent" size="md">
            {campaign.genre}
          </Badge>
        )}
        {campaign.description && (
          <p className="mt-4 text-[var(--text-muted)]">{campaign.description}</p>
        )}
      </div>

      {isDm && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-[var(--warning)]/30 bg-[var(--warning-subtle)] px-3 py-2 text-sm text-[var(--warning-text)]">
          <Crown size={14} />
          <span>Ты — ГМ этой кампании</span>
        </div>
      )}

      {stats && (
        <>
          <CampaignStatsGrid campaignId={id} stats={stats} />
          <EntitiesBreakdown campaignId={id} stats={stats.entities} />
          {isDm && <NeedsAttention campaignId={id} stats={stats} />}
          <RecentActivity campaignId={id} recent={stats.recent} />
        </>
      )}

      {!stats ||
        (stats.chapters.total === 0 && stats.entities.total === 0 && (
          <EmptyState
            icon="🏰"
            title="Кампания пока пустая"
            description={
              isDm ? 'Начни с создания первой главы или сущности.' : 'ГМ пока не добавил материалы.'
            }
            size="lg"
          />
        ))}
    </div>
  )
}
