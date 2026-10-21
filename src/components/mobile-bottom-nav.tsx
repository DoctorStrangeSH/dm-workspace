'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { getMobileNavItems } from '@/lib/campaign-nav-items'

interface Props {
  campaignId: string
}

/**
 * Мобильный bottom-nav — 5 главных пунктов навигации.
 * CHANGES: новый компонент. Показывается только на мобиле (md:hidden).
 * Учитывает `pb-safe` (safe-area-inset-bottom) для iPhone.
 */
export function MobileBottomNav({ campaignId }: Props) {
  const pathname = usePathname()
  const base = `/campaign/${campaignId}`
  const items = getMobileNavItems(base)

  return (
    <nav
      aria-label="Основная навигация"
      className="fixed right-0 bottom-0 left-0 z-30 border-t border-[var(--border-default)] bg-[var(--bg-app)]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <div className="grid grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] transition-colors',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]',
                isActive
                  ? 'text-[var(--accent-text)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              )}
            >
              <Icon size={18} />
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
