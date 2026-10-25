export const instant = false

import { connection } from 'next/server'
import { notFound, redirect } from 'next/navigation'
import { getCampaignAccess } from '@/lib/queries/access'
import { SessionModeLayout } from './session-mode-layout'

export default async function SessionLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  await connection()

  const { id: campaignId } = await params
  const { campaign, isDm, isMember } = await getCampaignAccess(campaignId)

  if (!campaign) notFound()
  if (!isMember) redirect('/dashboard')
  if (!isDm) redirect(`/campaign/${campaignId}`)

  return (
    <SessionModeLayout campaignId={campaignId} campaignName={campaign.name}>
      {children}
    </SessionModeLayout>
  )
}
