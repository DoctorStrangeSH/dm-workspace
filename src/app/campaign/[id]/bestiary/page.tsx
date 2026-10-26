export const instant = false

import { connection } from 'next/server'
import { notFound, redirect } from 'next/navigation'
import { getCampaignAccess } from '@/lib/queries/access'
import { searchSrdMonstersAction, getAvailableCRs } from '@/lib/actions/bestiary-search'
import { Breadcrumbs } from '@/components/breadcrumbs'
import BestiaryClient from './bestiary-client'
import { BookOpen, Sparkles } from 'lucide-react'
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

      <section className="relative mb-6 overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[linear-gradient(120deg,var(--bg-primary),var(--bg-secondary))] p-5 shadow-[var(--shadow-sm)] sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border border-[var(--accent)]/20">
          <div className="absolute inset-9 rounded-full border border-[var(--accent)]/15" />
          <Sparkles size={22} className="absolute bottom-10 left-8 text-[var(--accent)]/35" />
        </div>
        <div className="relative max-w-2xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/25 bg-[var(--accent-subtle)] px-3 py-1.5 text-xs font-medium text-[var(--accent-text)]">
            <BookOpen size={14} aria-hidden="true" />
            {lang === 'en' ? 'Creature compendium' : 'Энциклопедия существ'}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl">{t('nav.bestiary')}</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--text-secondary)] sm:text-base">{t('bestiary.subtitle')}</p>
        </div>
      </section>

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
