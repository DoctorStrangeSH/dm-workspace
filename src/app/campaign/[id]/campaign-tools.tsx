'use client'

import { BookMarked, MessageSquare } from 'lucide-react'
import { useDmScreenContext } from './dm-screen/dm-screen-context'
import { useT } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { usePathname } from 'next/navigation'

export function CampaignTools({ isDm }: { isDm: boolean }) {
  const t = useT()
  const inSession = /\/session(?:\/|$)/.test(usePathname())
  const { isChatOpen, isOpen, toggleChat, toggle } = useDmScreenContext()
  return (
    <nav
      aria-label={t('workspace.tools')}
      className="inline-flex shrink-0 items-center gap-1 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-1 shadow-[var(--shadow-sm)]"
    >
      {[
        {
          key: 'chat',
          label: t('chat.button'),
          icon: MessageSquare,
          active: isChatOpen,
          action: toggleChat,
          panel: inSession ? 'campaign-session-chat' : 'campaign-chat',
        },
        ...(isDm
          ? [
              {
                key: 'dm',
                label: t('dmScreen.button'),
                icon: BookMarked,
                active: isOpen,
                action: toggle,
                panel: 'campaign-dm',
              },
            ]
          : []),
      ].map(({ key, label, icon: Icon, active, action, panel }) => (
        <button
          key={key}
          type="button"
          aria-expanded={active}
          aria-controls={panel}
          onClick={action}
          className={cn(
            'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]',
            active
              ? 'bg-[var(--accent)] text-[var(--accent-foreground)] shadow-sm'
              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
          )}
        >
          <Icon size={17} aria-hidden="true" />
          {label}
        </button>
      ))}
    </nav>
  )
}

export function CampaignShell({ children }: { children: React.ReactNode }) {
  const { activePanel } = useDmScreenContext()
  const inSession = /\/session(?:\/|$)/.test(usePathname())
  return (
    <div
      className={cn(
        'min-h-screen bg-[var(--bg-app)] transition-[padding] duration-200 motion-reduce:transition-none',
        activePanel && !(inSession && activePanel === 'chat') && 'xl:pr-[26rem]'
      )}
    >
      {children}
    </div>
  )
}
