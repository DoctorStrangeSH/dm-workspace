'use client'

import Link from 'next/link'
import { MonitorPlay } from 'lucide-react'
import { Tooltip } from '@/components/ui'
import { useT } from '@/lib/i18n'

interface Props {
  campaignId: string
}

export function SessionModeToggle({ campaignId }: Props) {
  const t = useT()

  return (
    <Tooltip content={t('session.enter')}>
      <Link
        href={`/campaign/${campaignId}/session`}
        className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl border border-[var(--accent)]/40 bg-[var(--accent-subtle)] px-3 text-sm font-medium text-[var(--accent-text)] transition-colors hover:bg-[var(--accent)]/20 focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
        aria-label={t('session.enter')}
      >
        <MonitorPlay size={17} aria-hidden="true" />
        <span className="hidden sm:inline">{t('session.enterShort')}</span>
      </Link>
    </Tooltip>
  )
}
