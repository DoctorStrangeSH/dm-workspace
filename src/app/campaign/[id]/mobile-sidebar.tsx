'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Settings, Crown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getCampaignNavItems } from '@/lib/campaign-nav-items'

interface Props {
  campaignId: string
  isDm: boolean
}

export default function MobileSidebar({ campaignId, isDm }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const base = `/campaign/${campaignId}`
  const items = getCampaignNavItems(base)

  // CHANGES: убран useEffect(setIsOpen(false), [pathname]) → паттерн «props → state».
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
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-lg p-2 transition hover:bg-slate-800 md:hidden"
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
          'fixed top-0 left-0 z-50 h-screen w-64 border-r border-slate-800 bg-slate-950 transition-transform md:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <span className="text-sm font-semibold tracking-wider text-slate-400 uppercase">
            Меню
          </span>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-1.5 transition hover:bg-slate-800"
            title="Закрыть"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="h-[calc(100vh-57px)] space-y-1 overflow-y-auto p-4">
          {items.map((item) => {
            const Icon = item.icon
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
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

          {isDm && (
            <div className="mt-6 border-t border-slate-800 pt-6">
              <Link
                href={`${base}/settings`}
                onClick={() => setIsOpen(false)}
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
        </nav>
      </aside>
    </>
  )
}
