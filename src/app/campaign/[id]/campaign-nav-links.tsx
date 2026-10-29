'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowUpRight, Settings } from 'lucide-react'
import { getCampaignNavGroups, isCampaignNavActive } from '@/lib/campaign-nav-items'
import { useT } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export function CampaignNavLinks({
  campaignId,
  isDm,
  onNavigate,
}: {
  campaignId: string
  isDm: boolean
  onNavigate?: () => void
}) {
  const t = useT()
  const pathname = usePathname()
  const base = `/campaign/${campaignId}`
  const groups = getCampaignNavGroups(base, isDm)
  const linkClass = (active: boolean) =>
    cn(
      'group flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]',
      active
        ? 'bg-[var(--accent-subtle)] text-[var(--accent-text)] shadow-[inset_3px_0_0_var(--accent)]'
        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
    )
  return (
    <nav aria-label={t('nav.mainNavigation')} className="space-y-6">
      {groups.map((group) => (
        <section key={group.labelKey}>
          <h2 className="mb-2 px-3 text-[10px] font-semibold tracking-[0.14em] text-[var(--text-subtle)] uppercase">
            {t(group.labelKey)}
          </h2>
          <div className="space-y-1">
            {group.items.map((item) => {
              const Icon = item.icon
              const active = isCampaignNavActive(pathname, item)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? 'page' : undefined}
                  className={linkClass(active)}
                >
                  <Icon size={18} aria-hidden="true" className="shrink-0" />
                  <span className="min-w-0 flex-1 break-words">{t(item.labelKey)}</span>
                  {active && (
                    <span
                      aria-hidden="true"
                      className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]"
                    />
                  )}
                </Link>
              )
            })}
          </div>
        </section>
      ))}
      <div className="space-y-1 border-t border-[var(--border-default)] pt-3">
        {isDm && (
          <Link
            href={`${base}/settings`}
            onClick={onNavigate}
            aria-current={
              isCampaignNavActive(pathname, { href: `${base}/settings` }) ? 'page' : undefined
            }
            className={linkClass(isCampaignNavActive(pathname, { href: `${base}/settings` }))}
          >
            <Settings size={18} aria-hidden="true" />
            {t('nav.settings')}
          </Link>
        )}
        <Link href="/dashboard" onClick={onNavigate} className={linkClass(false)}>
          <ArrowUpRight size={18} aria-hidden="true" />
          {t('nav.allCampaigns')}
        </Link>
      </div>
    </nav>
  )
}
