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

export default function CampaignSidebar({ campaignId, isDm }: Props) {
  const pathname = usePathname()
  const base = `/campaign/${campaignId}`
  const items = getCampaignNavItems(base)

  return (
    <aside className="hidden min-h-[calc(100vh-57px)] w-56 border-r border-slate-800 p-4 md:block">
      <nav className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition',
                isActive
                  ? 'border border-indigo-900/50 bg-indigo-950/60 text-indigo-300'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              )}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {isDm && (
        <div className="mt-6 border-t border-slate-800 pt-6">
          <Link
            href={`${base}/settings`}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition',
              pathname.startsWith(`${base}/settings`)
                ? 'border border-indigo-900/50 bg-indigo-950/60 text-indigo-300'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            )}
          >
            <Settings size={16} />
            Настройки
          </Link>

          <div className="mt-3 flex items-center gap-2 px-3 text-xs text-amber-400">
            <Crown size={12} />
            <span>Режим ГМа</span>
          </div>
        </div>
      )}
    </aside>
  )
}
