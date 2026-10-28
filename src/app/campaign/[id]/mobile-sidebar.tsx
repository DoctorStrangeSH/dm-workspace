'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Settings, Crown, Compass } from 'lucide-react'
import { cn } from '@/lib/utils'
import { IconButton } from '@/components/ui'
import { useT } from '@/lib/i18n' // CHANGES
import { getCampaignNavItems } from '@/lib/campaign-nav-items'

interface Props {
  campaignId: string
  isDm: boolean
}

export default function MobileSidebar({ campaignId, isDm }: Props) {
  const t = useT() // CHANGES
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const base = `/campaign/${campaignId}`
  const items = getCampaignNavItems(base).filter((item) => !item.dmOnly || isDm)

  const [prevPathname, setPrevPathname] = useState(pathname)
  if (pathname !== prevPathname) {
    setPrevPathname(pathname)
    setIsOpen(false)
  }

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen])

  return (
    <>
      <IconButton
        variant="ghost"
        size="md"
        label={t('common.openMenu')}
        onClick={() => setIsOpen(true)}
        className="md:hidden"
      >
        <Menu size={20} />
      </IconButton>

      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-[var(--bg-overlay)] backdrop-blur-sm md:hidden"
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 z-50 flex h-dvh w-[min(19rem,85vw)] flex-col overflow-hidden border-r border-[var(--border-default)] bg-[var(--bg-primary)] shadow-[var(--shadow-xl)] transition-transform md:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--border-default)] px-4 py-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
          <span className="flex items-center gap-2 text-sm font-semibold tracking-wide text-[var(--accent-text)]">
            <Compass size={17} aria-hidden="true" />
            {t('nav.menu')}
          </span>
          <IconButton
            variant="ghost"
            size="sm"
            label={t('common.close')}
            onClick={() => setIsOpen(false)}
          >
            <X size={18} />
          </IconButton>
        </div>

        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain p-3 pb-[calc(1rem+env(safe-area-inset-bottom))]" aria-label={t('nav.mainNavigation')}>
          {items.map((item) => {
            const Icon = item.icon
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]',
                  isActive
                    ? 'bg-[var(--accent-subtle)] text-[var(--accent-text)] shadow-[inset_3px_0_0_var(--accent)]'
                    : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                )}
              >
                <Icon size={18} className="shrink-0" aria-hidden="true" />
                <span className="truncate">{t(item.labelKey)}</span>
              </Link>
            )
          })}

          {isDm && (
            <div className="mt-6 border-t border-[var(--border-default)] pt-6">
              <Link
                href={`${base}/settings`}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]',
                  pathname.startsWith(`${base}/settings`)
                    ? 'bg-[var(--accent-subtle)] text-[var(--accent-text)]'
                    : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                )}
              >
                <Settings size={16} />
                {t('nav.settings')} {/* CHANGES */}
              </Link>

              <div className="mt-3 flex items-center gap-2 px-3 text-xs text-[var(--warning-text)]">
                <Crown size={12} />
                <span>{t('role.dm')}</span> {/* CHANGES */}
              </div>
            </div>
          )}
        </nav>
      </aside>
    </>
  )
}
