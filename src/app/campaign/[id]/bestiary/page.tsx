export const instant = false

import { connection } from 'next/server'
import { notFound, redirect } from 'next/navigation'
import { getCampaignAccess } from '@/lib/queries/access'
import {
  searchSrdMonstersAction,
  getAvailableCRs,
} from '@/lib/actions/bestiary-search'
import { Breadcrumbs } from '@/components/breadcrumbs'
import BestiaryClient from './bestiary-client'

export default async function BestiaryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await connection()

  const { id: campaignId } = await params
  const { campaign, isDm, isMember } = await getCampaignAccess(campaignId)

  if (!campaign) notFound()
  if (!isMember) redirect('/dashboard')

  // Начальные данные — через Server Action
  const [monsters, availableCRs] = await Promise.all([
    searchSrdMonstersAction({ limit: 100 }),
    getAvailableCRs(),
  ])

  return (
    <div className="max-w-6xl">
      <Breadcrumbs
        items={[
          { label: 'Дашборд', href: '/dashboard' },
          { label: campaign.name, href: `/campaign/${campaignId}` },
          { label: 'Бестиарий' },
        ]}
        className="mb-4"
      />

      <div className="mb-6">
        <h1 className="text-2xl font-bold">Бестиарий</h1>
        <p className="text-slate-400 text-sm mt-1">
          Поиск монстров из SRD 2024. Всего в базе: ~330.
        </p>
      </div>

      <BestiaryClient
        campaignId={campaignId}
        initialMonsters={monsters}
        availableCRs={availableCRs}
        canEdit={isDm}
      />
    </div>
  )
}