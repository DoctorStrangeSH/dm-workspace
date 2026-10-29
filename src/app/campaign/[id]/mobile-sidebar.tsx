'use client'

import { useEffect, useRef } from 'react'
import { Menu, X, Compass } from 'lucide-react'
import { useT } from '@/lib/i18n'
import { useDmScreenContext } from './dm-screen/dm-screen-context'
import { CampaignNavLinks } from './campaign-nav-links'

export default function MobileSidebar({ campaignId, isDm }: { campaignId: string; isDm: boolean }) {
  const t = useT()
  const { isNavigationOpen: isOpen, openNavigation, close } = useDmScreenContext()
  const dialogRef = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog || !isOpen) return
    const desktop = window.matchMedia('(min-width: 768px)')
    if (desktop.matches) {
      close()
      return
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog.showModal()
    const handleResize = () => {
      if (desktop.matches) close()
    }
    desktop.addEventListener('change', handleResize)
    window.addEventListener('popstate', close)
    return () => {
      desktop.removeEventListener('change', handleResize)
      window.removeEventListener('popstate', close)
      dialog.close()
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen, close])
  return (
    <>
      <button
        type="button"
        onClick={openNavigation}
        aria-label={t('common.openMenu')}
        aria-controls="campaign-navigation"
        aria-expanded={isOpen}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--border-default)] text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] md:hidden"
      >
        <Menu size={20} aria-hidden="true" />
      </button>
      <dialog
        ref={dialogRef}
        id="campaign-navigation"
        aria-labelledby="campaign-navigation-title"
        onCancel={(event) => {
          event.preventDefault()
          close()
        }}
        onKeyDown={(event) => {
          if (event.key !== 'Tab') return
          const targets = event.currentTarget.querySelectorAll<HTMLElement>(
            'button:not(:disabled), a[href]'
          )
          const first = targets[0],
            last = targets[targets.length - 1]
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault()
            last?.focus()
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault()
            first?.focus()
          }
        }}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return
          const bounds = event.currentTarget.getBoundingClientRect()
          if (
            event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom
          )
            close()
        }}
        className="fixed inset-y-0 right-auto left-0 z-50 m-0 hidden h-dvh max-h-none w-[min(21rem,90vw)] max-w-none flex-col overflow-hidden border-0 border-r border-[var(--border-default)] bg-[var(--bg-primary)] p-0 text-[var(--text-primary)] shadow-[var(--shadow-xl)] backdrop:bg-black/50 backdrop:backdrop-blur-sm open:flex"
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--border-default)] px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-4">
          <div>
            <h2 id="campaign-navigation-title" className="flex items-center gap-2 font-bold">
              <Compass size={18} className="text-[var(--accent-text)]" aria-hidden="true" />
              {t('nav.menu')}
            </h2>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              {t(isDm ? 'nav.dmDescription' : 'nav.playerDescription')}
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label={t('common.close')}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--border-default)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <CampaignNavLinks campaignId={campaignId} isDm={isDm} onNavigate={close} />
        </div>
      </dialog>
    </>
  )
}
