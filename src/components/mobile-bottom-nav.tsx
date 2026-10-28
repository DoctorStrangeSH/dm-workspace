'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n'
import { getMobileNavItems } from '@/lib/campaign-nav-items'

interface Props {
  campaignId: string
}

export function MobileBottomNav({ campaignId }: Props) {
  const t = useT()
  const pathname = usePathname()
  const base = `/campaign/${campaignId}`
  const items = getMobileNavItems(base)

  return (
    <nav
      aria-label={t('nav.mainNavigation')}
      className="fixed right-0 bottom-0 left-0 z-30 border-t border-[var(--border-default)] bg-[var(--bg-primary)]/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgb(0_0_0/0.12)] backdrop-blur-xl md:hidden"
    >
      <div className="grid grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'relative flex min-w-0 min-h-16 flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] font-medium transition-colors touch-manipulation active:bg-[var(--bg-active)]',
                'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--focus-ring)]',
                isActive
                  ? 'text-[var(--accent-text)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              )}
            >
              {isActive && <span aria-hidden="true" className="absolute top-0 left-1/4 right-1/4 h-0.5 rounded-b-full bg-[var(--accent)]" />}
              <Icon size={22} strokeWidth={isActive ? 2.3 : 1.8} aria-hidden="true" />
              <span className="line-clamp-2 max-w-full break-words text-center leading-tight">{t(item.labelKey)}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
