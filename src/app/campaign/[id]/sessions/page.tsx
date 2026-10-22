export const instant = false

import { connection } from 'next/server'
import { notFound, redirect } from 'next/navigation'
import { getCampaignAccess } from '@/lib/queries/access'
import { getSessions } from '@/lib/queries/sessions'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { SessionsClient } from './sessions-client'
import { Calendar } from 'lucide-react'

export default async function SessionsPage({ params }: { params: Promise<{ id: string }> }) {
  await connection()

  const { id: campaignId } = await params
  const { campaign, isDm, isMember } = await getCampaignAccess(campaignId)

  if (!campaign) notFound()
  if (!isMember) redirect('/dashboard')

  const sessions = await getSessions(campaignId)

  return (
    <div className="max-w-4xl">
      <Breadcrumbs
        items={[
          { label: 'Дашборд', href: '/dashboard' },
          { label: campaign.name, href: `/campaign/${campaignId}` },
          { label: 'Сессии' },
        ]}
        className="mb-4"
      />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-[var(--text-primary)]">
            <Calendar size={22} className="text-[var(--accent-text)]" />
            Сессии
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {sessions.length} {sessions.length === 1 ? 'сессия' : 'сессий'}
          </p>
        </div>
      </div>

      <SessionsClient campaignId={campaignId} initialSessions={sessions} isDm={isDm} />
    </div>
  )
}
