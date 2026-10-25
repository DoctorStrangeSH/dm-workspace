export const instant = false

import { connection } from 'next/server'
import { notFound, redirect } from 'next/navigation'
import { getCampaignAccess } from '@/lib/queries/access'
import { searchSrdMonstersAction, getAvailableCRs } from '@/lib/actions/bestiary-search'
import { Breadcrumbs } from '@/components/breadcrumbs'
import BestiaryClient from './bestiary-client'
import { getLang } from '@/lib/i18n/get-lang'
import { createT, getDictionary } from '@/lib/i18n/dictionaries'

export default async function BestiaryPage({ params }: { params: Promise<{ id: string }> }) {
  await connection()

  const lang = await getLang()
  const t = createT(getDictionary(lang))

  const { id: campaignId } = await params
  const { campaign, isDm, isMember } = await getCampaignAccess(campaignId)
  if (!campaign) notFound()
  if (!isMember) redirect('/dashboard')

  const [monsters, availableCRs] = await Promise.all([
    searchSrdMonstersAction({ limit: 100 }),
    getAvailableCRs(),
  ])

  return (
    <div className="max-w-6xl">
      <Breadcrumbs
        items={[
          { label: t('nav.dashboard'), href: '/dashboard' },
          { label: campaign.name, href: `/campaign/${campaignId}` },
          { label: t('nav.bestiary') },
        ]}
        className="mb-4"
      />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">{t('nav.bestiary')}</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">{t('bestiary.subtitle')}</p>
      </div>

      <BestiaryClient
        campaignId={campaignId}
        initialMonsters={monsters}
        availableCRs={availableCRs}
        canEdit={isDm}
        lang={lang}
      />
    </div>
  )
}
