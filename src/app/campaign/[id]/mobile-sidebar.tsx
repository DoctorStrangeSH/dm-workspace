'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Menu,
  X,
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

export default function MobileSidebar({ campaignId, isDm }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const base = `/campaign/${campaignId}`

  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

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
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden p-2 hover:bg-slate-800 rounded-lg transition"
        title="Меню"
        aria-label="Открыть меню"
      >
        <Menu size={20} />
      </button>

      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen w-64 bg-slate-950 border-r border-slate-800 transition-transform md:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
            Меню
          </span>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-slate-800 rounded-lg transition"
            title="Закрыть"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-57px)]">
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
        </nav>
      </aside>
    </>
  )
}