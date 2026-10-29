'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, MessageSquare, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { IconButton, Tooltip } from '@/components/ui'
import { useT } from '@/lib/i18n'
import { useDmScreenContext } from '../dm-screen/dm-screen-context'

interface Props {
  campaignId: string
  campaignName: string
  children: React.ReactNode
}

export function SessionModeLayout({ campaignId, campaignName, children }: Props) {
  const t = useT()
  const { isChatOpen: chatOpen, toggleChat, openChat, close } = useDmScreenContext()
  const [mobilePane, setMobilePane] = useState<'chapter' | 'scene'>('scene')

  return (
    <div className="flex h-[75dvh] min-h-96 flex-col overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-app)]">
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
            onClick={toggleChat}
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

      <nav
        aria-label={t('workspace.tools')}
        className="flex shrink-0 gap-1 border-b border-[var(--border-default)] bg-[var(--bg-surface)] p-2 xl:hidden"
      >
        {(['chapter', 'scene', 'chat'] as const).map((pane) => (
          <button
            key={pane}
            type="button"
            aria-pressed={pane === 'chat' ? chatOpen : !chatOpen && mobilePane === pane}
            onClick={() => {
              if (pane === 'chat') openChat()
              else {
                setMobilePane(pane)
                close()
              }
            }}
            className={cn(
              'min-h-11 flex-1 rounded-xl px-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]',
              (pane === 'chat' ? chatOpen : !chatOpen && mobilePane === pane)
                ? 'bg-[var(--accent-subtle)] text-[var(--accent-text)]'
                : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'
            )}
          >
            {pane === 'chat'
              ? t('chat.button')
              : t(pane === 'chapter' ? 'session.chapterTab' : 'session.sceneTab')}
          </button>
        ))}
      </nav>

      <div
        className={cn(
          'grid min-h-0 flex-1 grid-cols-1 [&>*]:min-w-0 xl:[&>:nth-child(1)]:flex xl:[&>:nth-child(2)]:flex',
          !chatOpen && mobilePane === 'chapter'
            ? '[&>:nth-child(1)]:flex'
            : '[&>:nth-child(1)]:hidden',
          !chatOpen && mobilePane === 'scene'
            ? '[&>:nth-child(2)]:flex'
            : '[&>:nth-child(2)]:hidden',
          chatOpen
            ? 'xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_22rem] [&>:nth-child(3)]:flex'
            : 'xl:grid-cols-2 [&>:nth-child(3)]:hidden'
        )}
      >
        {children}
      </div>
    </div>
  )
}
