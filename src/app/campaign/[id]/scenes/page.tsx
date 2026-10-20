export const instant = false

import { connection } from 'next/server'
import { notFound, redirect } from 'next/navigation'
import { getCampaignAccess } from '@/lib/queries/access'
import { getScenes } from '@/lib/queries/scenes'
import { Breadcrumbs } from '@/components/breadcrumbs'
import ScenesClient from './scenes-client'

export default async function ScenesPage({ params }: { params: Promise<{ id: string }> }) {
  await connection()

  const { id: campaignId } = await params
  const { campaign, isDm, isMember } = await getCampaignAccess(campaignId)

  if (!campaign) notFound()
  if (!isMember) redirect('/dashboard')

  const scenes = await getScenes(campaignId)

  return (
    <div className="max-w-6xl">
      <Breadcrumbs
        items={[
          { label: 'Дашборд', href: '/dashboard' },
          { label: campaign.name, href: `/campaign/${campaignId}` },
          { label: 'Сцены' },
        ]}
        className="mb-4"
      />

      <ScenesClient campaignId={campaignId} initialScenes={scenes} isDm={isDm} />
    </div>
  )
}
