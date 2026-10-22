export const instant = false

import { connection } from 'next/server'
import { notFound, redirect } from 'next/navigation'
import { getCampaignAccess } from '@/lib/queries/access'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { GeneratorsClient } from './generators-client'

export default async function GeneratorsPage({ params }: { params: Promise<{ id: string }> }) {
  await connection()

  const { id: campaignId } = await params
  const { campaign, isDm, isMember } = await getCampaignAccess(campaignId)

  if (!campaign) notFound()
  if (!isMember) redirect('/dashboard')
  if (!isDm) redirect(`/campaign/${campaignId}`)

  return (
    <div className="max-w-5xl">
      <Breadcrumbs
        items={[
          { label: 'Дашборд', href: '/dashboard' },
          { label: campaign.name, href: `/campaign/${campaignId}` },
          { label: 'Генераторы' },
        ]}
        className="mb-4"
      />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Генераторы</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Сокровища, магазины, энкаунтеры, wild magic, безумие — для импровизации
        </p>
      </div>

      <GeneratorsClient />
    </div>
  )
}
