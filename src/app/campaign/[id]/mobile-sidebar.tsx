'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Settings, Crown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { IconButton } from '@/components/ui'
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
      <IconButton
        variant="ghost"
        size="md"
        label="Открыть меню"
        onClick={() => setIsOpen(true)}
        className="md:hidden"
      >
        <Menu size={20} />
      </IconButton>

      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-[var(--bg-overlay)] backdrop-blur-sm md:hidden"
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen w-64 border-r border-[var(--border-default)] bg-[var(--bg-app)] transition-transform md:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between border-b border-[var(--border-default)] px-4 py-3">
          <span className="text-sm font-semibold tracking-wider text-[var(--text-muted)] uppercase">
            Меню
          </span>
          <IconButton variant="ghost" size="sm" label="Закрыть" onClick={() => setIsOpen(false)}>
            <X size={18} />
          </IconButton>
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

          {isDm && (
            <div className="mt-6 border-t border-[var(--border-default)] pt-6">
              <Link
                href={`${base}/settings`}
                onClick={() => setIsOpen(false)}
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
        </nav>
      </aside>
    </>
  )
}
