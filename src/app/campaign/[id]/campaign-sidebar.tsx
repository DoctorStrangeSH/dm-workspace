'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Settings, Crown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getCampaignNavItems } from '@/lib/campaign-nav-items'

interface Props {
  campaignId: string
  isDm: boolean
}

// CHANGES: все цвета на семантических токенах (--border-default, --bg-app, --text-*)
// Активный пункт: --accent-subtle + --accent-text (вместо hardcoded indigo-*)
export default function CampaignSidebar({ campaignId, isDm }: Props) {
  const pathname = usePathname()
  const base = `/campaign/${campaignId}`
  const items = getCampaignNavItems(base)

  return (
    <aside className="hidden min-h-[calc(100vh-57px)] w-56 border-r border-[var(--border-default)] bg-[var(--bg-app)] p-4 md:block">
      <nav className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]',
                isActive
                  ? 'bg-[var(--accent-subtle)] text-[var(--accent-text)]'
                  : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
              )}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {isDm && (
        <div className="mt-6 border-t border-[var(--border-default)] pt-6">
          <Link
            href={`${base}/settings`}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]',
              pathname.startsWith(`${base}/settings`)
                ? 'bg-[var(--accent-subtle)] text-[var(--accent-text)]'
                : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
            )}
          >
            <Settings size={16} />
            Настройки
          </Link>

          <div className="mt-3 flex items-center gap-2 px-3 text-xs text-[var(--warning-text)]">
            <Crown size={12} />
            <span>Режим ГМа</span>
          </div>
        </div>
      )}
    </aside>
  )
}
