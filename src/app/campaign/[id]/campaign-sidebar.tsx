'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  BookOpen,
  Users,
  MapPin,
  Package,
  Skull,
  Settings,
  Crown,
  Sword,
  Library,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'


interface Props {
  campaignId: string
  isDm: boolean
}

export default function CampaignSidebar({ campaignId, isDm }: Props) {
  const pathname = usePathname()
  const base = `/campaign/${campaignId}`

  const items = [
    { href: base, label: 'Обзор', icon: Home, exact: true },
    { href: `${base}/chapters`, label: 'Главы', icon: BookOpen },
    { href: `${base}/characters`, label: 'Персонажи', icon: Sword },
    { href: `${base}/entities`, label: 'Сущности', icon: Users },
    { href: `${base}/bestiary`, label: 'Бестиарий', icon: Library },
    { href: `${base}/spells`, label: 'Заклинания', icon: Sparkles },
    { href: `${base}/npcs`, label: 'NPC', icon: Users },
    { href: `${base}/locations`, label: 'Локации', icon: MapPin },
    { href: `${base}/items`, label: 'Предметы', icon: Package },
    { href: `${base}/monsters`, label: 'Монстры', icon: Skull },
  ]

  return (
    <aside className="w-56 border-r border-slate-800 min-h-[calc(100vh-57px)] p-4 hidden md:block">
      <nav className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition',
                isActive
                  ? 'bg-indigo-950/60 text-indigo-300 border border-indigo-900/50'
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
        <div className="mt-6 pt-6 border-t border-slate-800">
          <Link
            href={`${base}/settings`}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition',
              pathname.startsWith(`${base}/settings`)
                ? 'bg-indigo-950/60 text-indigo-300 border border-indigo-900/50'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            )}
          >
            <Settings size={16} />
            Настройки
          </Link>

          <div className="mt-3 flex items-center gap-2 text-xs text-amber-400 px-3">
            <Crown size={12} />
            <span>Режим ГМа</span>
          </div>
        </div>
      )}
    </aside>
  )
}