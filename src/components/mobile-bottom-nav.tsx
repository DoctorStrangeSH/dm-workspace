'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n'
import { getMobileNavItems, isCampaignNavActive } from '@/lib/campaign-nav-items'
import { useDmScreenContext } from '@/app/campaign/[id]/dm-screen/dm-screen-context'

export function MobileBottomNav({ campaignId }: { campaignId: string }) {
  const t = useT()
  const pathname = usePathname()
  const items = getMobileNavItems(`/campaign/${campaignId}`)
  const { isNavigationOpen, openNavigation } = useDmScreenContext()
  const moreActive = isNavigationOpen || !items.some((item) => isCampaignNavActive(pathname, item))
  const itemClass = (active: boolean) =>
    cn(
      'relative flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] font-medium transition-colors touch-manipulation active:bg-[var(--bg-active)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--focus-ring)]',
      active
        ? 'text-[var(--accent-text)]'
        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
    )
  return (
    <nav
      aria-label={t('nav.quickNavigation')}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--border-default)] bg-[var(--bg-primary)] pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgb(0_0_0/0.12)] md:hidden"
    >
      <div className="grid grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon
          const active = isCampaignNavActive(pathname, item)
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={itemClass(active)}
            >
              {active && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-1/4 top-0 h-0.5 rounded-b-full bg-[var(--accent)]"
                />
              )}
              <Icon size={21} strokeWidth={active ? 2.3 : 1.8} aria-hidden="true" />
              <span className="line-clamp-2 max-w-full text-center leading-tight break-words">
                {t(item.labelKey)}
              </span>
            </Link>
          )
        })}
        <button
          type="button"
          onClick={openNavigation}
          aria-expanded={isNavigationOpen}
          aria-controls="campaign-navigation"
          className={itemClass(moreActive)}
        >
          <MoreHorizontal size={22} aria-hidden="true" />
          <span>{t('nav.more')}</span>
        </button>
      </div>
    </nav>
  )
}
