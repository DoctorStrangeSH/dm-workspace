'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, MessageSquare, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { IconButton, Tooltip } from '@/components/ui'
import { useT } from '@/lib/i18n'

interface Props {
  campaignId: string
  campaignName: string
  children: React.ReactNode
}

export function SessionModeLayout({ campaignId, campaignName, children }: Props) {
  const t = useT()
  const [chatOpen, setChatOpen] = useState(true)

  return (
    <div className="flex h-screen flex-col bg-[var(--bg-app)]">
      <header className="sticky top-0 z-30 flex shrink-0 items-center gap-2 border-b border-[var(--border-default)] bg-[var(--bg-app)]/95 px-3 py-2 backdrop-blur">
        <Tooltip content={t('session.backToCampaign')}>
          <Link
            href={`/campaign/${campaignId}`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
            aria-label={t('session.backToCampaign')}
          >
            <ArrowLeft size={18} />
          </Link>
        </Tooltip>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="rounded bg-[var(--accent)] px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase">
              {t('session.badge')}
            </span>
            <h1 className="truncate text-sm font-semibold text-[var(--text-primary)]">
              {campaignName}
            </h1>
          </div>
        </div>

        <Tooltip content={chatOpen ? t('session.hideChat') : t('session.showChat')}>
          <IconButton
            variant={chatOpen ? 'secondary' : 'ghost'}
            size="sm"
            label={chatOpen ? t('session.hideChat') : t('session.showChat')}
            onClick={() => setChatOpen((v) => !v)}
          >
            <MessageSquare size={16} />
          </IconButton>
        </Tooltip>

        <Tooltip content={t('session.exit')}>
          <Link
            href={`/campaign/${campaignId}`}
            className="inline-flex h-8 items-center gap-1 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] px-2.5 text-xs text-[var(--text-secondary)] transition-colors hover:border-[var(--border-hover)] hover:text-[var(--text-primary)]"
          >
            <X size={12} />
            {t('session.exit')}
          </Link>
        </Tooltip>
      </header>

      <div
        className={cn(
          'grid min-h-0 flex-1',
          chatOpen ? 'grid-cols-[1fr_1fr_400px]' : 'grid-cols-[1fr_1fr]'
        )}
      >
        {children}
      </div>
    </div>
  )
}
