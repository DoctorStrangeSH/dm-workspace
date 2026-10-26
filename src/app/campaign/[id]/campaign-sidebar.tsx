'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Settings, Crown, Compass } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n'
import { getCampaignNavItems } from '@/lib/campaign-nav-items'

interface Props {
  campaignId: string
  isDm: boolean
}

export default function CampaignSidebar({ campaignId, isDm }: Props) {
  const t = useT() // CHANGES
  const pathname = usePathname()
  const base = `/campaign/${campaignId}`
  const items = getCampaignNavItems(base).filter((item) => !item.dmOnly || isDm)

  return (
    <aside className="sticky top-[65px] hidden h-[calc(100dvh-65px)] w-60 shrink-0 self-start overflow-y-auto border-r border-[var(--border-default)] bg-[var(--bg-primary)]/60 p-3 backdrop-blur-sm md:block">
      <div className="mb-5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent-text)]">
          <Compass size={16} aria-hidden="true" />
          {t('nav.mainNavigation')}
        </div>
      </div>
      <nav className="space-y-1" aria-label={t('nav.mainNavigation')}>
        {items.map((item) => {
          const Icon = item.icon
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'group relative flex min-h-10 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]',
                isActive
                  ? 'bg-[var(--accent-subtle)] text-[var(--accent-text)] shadow-[inset_3px_0_0_var(--accent)]'
                  : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
              )}
            >
              <Icon size={17} className="shrink-0" aria-hidden="true" />
              <span className="truncate">{t(item.labelKey)}</span>
            </Link>
          )
        })}
      </nav>

      {isDm && (
        <div className="mt-5 border-t border-[var(--border-default)] pt-4">
          <Link
            href={`${base}/settings`}
            aria-current={pathname.startsWith(`${base}/settings`) ? 'page' : undefined}
            className={cn(
              'flex min-h-10 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]',
              pathname.startsWith(`${base}/settings`)
                ? 'bg-[var(--accent-subtle)] text-[var(--accent-text)]'
                : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
            )}
          >
            <Settings size={16} />
            {t('nav.settings')} {/* CHANGES: было «Настройки» */}
          </Link>

          <div className="mt-3 flex items-center gap-2 px-3 text-xs text-[var(--warning-text)]">
            <Crown size={12} />
            <span>{t('role.dm')}</span> {/* CHANGES: было «Режим ГМа» */}
          </div>
        </div>
      )}
    </aside>
  )
}
