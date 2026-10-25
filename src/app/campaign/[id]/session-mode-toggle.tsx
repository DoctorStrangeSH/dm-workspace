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
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--accent)]/40 bg-[var(--accent-subtle)] px-2.5 text-xs font-medium text-[var(--accent-text)] transition-colors hover:bg-[var(--accent)]/20"
        aria-label={t('session.enter')}
      >
        <MonitorPlay size={14} />
        <span className="hidden sm:inline">{t('session.enterShort')}</span>
      </Link>
    </Tooltip>
  )
}
