export const instant = false

import { connection } from 'next/server'
import { notFound, redirect } from 'next/navigation'
import { getCampaignAccess } from '@/lib/queries/access'
import { getSessions } from '@/lib/queries/sessions'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { SessionsClient } from './sessions-client'
import { Calendar } from 'lucide-react'
import { getLang } from '@/lib/i18n/get-lang'
import { createT, getDictionary } from '@/lib/i18n/dictionaries'
import { pluralize } from '@/lib/i18n/plural'

export default async function SessionsPage({ params }: { params: Promise<{ id: string }> }) {
  await connection()

  const lang = await getLang()
  const t = createT(getDictionary(lang))

  const { id: campaignId } = await params
  const { campaign, isDm, isMember } = await getCampaignAccess(campaignId)

  if (!campaign) notFound()
  if (!isMember) redirect('/dashboard')

  const sessions = await getSessions(campaignId)

  const countLabel = pluralize(lang, sessions.length, {
    one: t('sessions.count.one'),
    few: t('sessions.count.few'),
    many: t('sessions.count.many'),
  })

  return (
    <div className="max-w-4xl">
      <Breadcrumbs
        items={[
          { label: t('nav.dashboard'), href: '/dashboard' },
          { label: campaign.name, href: `/campaign/${campaignId}` },
          { label: t('nav.sessions') },
        ]}
        className="mb-4"
      />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-[var(--text-primary)]">
            <Calendar size={22} className="text-[var(--accent-text)]" />
            {t('nav.sessions')}
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {sessions.length} {countLabel}
          </p>
        </div>
      </div>

      <SessionsClient campaignId={campaignId} initialSessions={sessions} isDm={isDm} />
    </div>
  )
}
