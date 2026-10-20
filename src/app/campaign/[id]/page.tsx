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
        items={[
          { label: 'Дашборд', href: '/dashboard' },
          { label: campaign.name },
        ]}
        className="mb-4"
      />

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{campaign.name}</h1>
        {campaign.genre && (
          <span className="text-xs px-2 py-1 bg-indigo-950/60 border border-indigo-900/50 text-indigo-300 rounded-full">
            {campaign.genre}
          </span>
        )}
        {campaign.description && (
          <p className="text-slate-400 mt-4">{campaign.description}</p>
        )}
      </div>

      {isDm && (
        <div className="mb-6 flex items-center gap-2 text-sm text-amber-400 bg-amber-950/20 border border-amber-900/30 rounded-lg px-3 py-2">
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

      {!stats || (stats.chapters.total === 0 && stats.entities.total === 0) && (
        <div className="border-2 border-dashed border-slate-800 rounded-2xl p-12 text-center">
          <p className="text-slate-400 mb-2">Кампания пока пустая</p>
          <p className="text-slate-500 text-sm">
            {isDm
              ? 'Начни с создания первой главы или сущности.'
              : 'ГМ пока не добавил материалы.'}
          </p>
        </div>
      )}
    </div>
  )
}