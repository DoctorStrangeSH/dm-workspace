'use client'

import { Crown, Users } from 'lucide-react'
import { useT } from '@/lib/i18n'
import { CampaignNavLinks } from './campaign-nav-links'

export default function CampaignSidebar({
  campaignId,
  isDm,
}: {
  campaignId: string
  isDm: boolean
}) {
  const t = useT()
  const Icon = isDm ? Crown : Users
  return (
    <aside className="sticky top-[var(--campaign-header-height,8rem)] hidden h-[calc(100dvh_-_var(--campaign-header-height,8rem))] w-60 shrink-0 self-start overflow-y-auto overscroll-contain border-r border-[var(--border-default)] bg-[var(--bg-primary)] p-3 md:block">
      <div className="mb-5 flex items-center gap-3 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-subtle)] text-[var(--accent-text)]">
          <Icon size={19} aria-hidden="true" />
        </div>
        <div>
          <p className="text-xs font-semibold text-[var(--text-primary)]">{t('nav.workspace')}</p>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            {t(isDm ? 'role.dm' : 'role.player')}
          </p>
        </div>
      </div>
      <CampaignNavLinks campaignId={campaignId} isDm={isDm} />
    </aside>
  )
}
