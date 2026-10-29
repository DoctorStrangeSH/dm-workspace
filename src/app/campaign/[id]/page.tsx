export const instant = false

import { connection } from 'next/server'
import { notFound } from 'next/navigation'
import { getCampaignAccess } from '@/lib/queries/access'
import { getCampaignStats } from '@/lib/queries/stats'
import { getActiveScene } from '@/lib/queries/scenes'
import CampaignOverview from './campaign-overview'
import { getLang } from '@/lib/i18n/get-lang'

export default async function CampaignOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await connection()

  const lang = await getLang()

  const { id } = await params
  const { campaign, isDm } = await getCampaignAccess(id)

  if (!campaign) notFound()

  const [stats, activeScene] = await Promise.all([
    getCampaignStats(id),
    isDm ? getActiveScene(id) : Promise.resolve(null),
  ])
  // Request-scoped server time after connection(), shared by all relative labels.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now()

  return (
    <CampaignOverview
      campaign={campaign}
      isDm={isDm}
      stats={stats}
      activeScene={activeScene}
      lang={lang}
      now={now}
    />
  )
}
