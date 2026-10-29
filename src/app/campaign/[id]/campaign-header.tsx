'use client'

import { useEffect, useLayoutEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, SlidersHorizontal } from 'lucide-react'
import { useT } from '@/lib/i18n'
import { CampaignTools } from './campaign-tools'
import MobileSidebar from './mobile-sidebar'

export function CampaignHeader({
  campaignId,
  name,
  genre,
  isDm,
  preferences,
  search,
  actions,
  presence,
}: {
  campaignId: string
  name: string
  genre?: string | null
  isDm: boolean
  preferences?: React.ReactNode
  search?: React.ReactNode
  actions?: React.ReactNode
  presence?: React.ReactNode
}) {
  const t = useT()
  const headerRef = useRef<HTMLElement>(null)
  const appearanceRef = useRef<HTMLDetailsElement>(null)
  useLayoutEffect(() => {
    const header = headerRef.current
    const shell = header?.closest<HTMLElement>('[data-campaign-shell]')
    if (!header || !shell) return
    const measure = () =>
      shell.style.setProperty(
        '--campaign-header-height',
        `${header.getBoundingClientRect().height}px`
      )
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(header)
    return () => {
      observer.disconnect()
      shell.style.removeProperty('--campaign-header-height')
    }
  }, [])
  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (!appearanceRef.current?.contains(event.target as Node))
        appearanceRef.current?.removeAttribute('open')
    }
    const closeEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !appearanceRef.current?.open || event.defaultPrevented) return
      event.preventDefault()
      appearanceRef.current.open = false
      appearanceRef.current.querySelector('summary')?.focus()
    }
    document.addEventListener('pointerdown', closeOutside)
    document.addEventListener('keydown', closeEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOutside)
      document.removeEventListener('keydown', closeEscape)
    }
  }, [])
  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-30 border-b border-[var(--border-default)] bg-[var(--bg-primary)] shadow-[var(--shadow-sm)]"
    >
      <div className="flex items-center gap-2 px-3 py-3 sm:gap-3 sm:px-5">
        <MobileSidebar campaignId={campaignId} isDm={isDm} />
        <Link
          href="/dashboard"
          aria-label={t('nav.allCampaigns')}
          className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--border-default)] text-[var(--text-muted)] transition hover:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] md:flex"
        >
          <ArrowLeft size={18} aria-hidden="true" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2 text-[10px] font-semibold tracking-widest text-[var(--text-muted)] uppercase">
            <span>{t('nav.campaign')}</span>
            <span aria-hidden="true">/</span>
            <span className="text-[var(--accent-text)]">{t(isDm ? 'role.dm' : 'role.player')}</span>
          </div>
          <h1
            className="truncate text-base font-bold tracking-tight text-[var(--text-primary)] sm:text-lg"
            title={name}
          >
            {name}
          </h1>
          {genre && (
            <p className="mt-0.5 hidden truncate text-xs text-[var(--text-muted)] sm:block">
              {genre}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {search}
          <details ref={appearanceRef} className="relative">
            <summary
              aria-label={t('nav.appearance')}
              title={t('nav.appearance')}
              className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-xl border border-[var(--border-default)] text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] [&::-webkit-details-marker]:hidden"
            >
              <SlidersHorizontal size={18} aria-hidden="true" />
            </summary>
            <div className="absolute top-full right-0 z-40 mt-2 min-w-56 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-3 shadow-[var(--shadow-xl)]">
              <p className="mb-3 text-xs font-semibold text-[var(--text-muted)]">
                {t('nav.appearance')}
              </p>
              <div className="flex items-center gap-2">{preferences}</div>
            </div>
          </details>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-default)] px-3 py-2 sm:px-5">
        <CampaignTools isDm={isDm} />
        <div className="flex flex-wrap items-center gap-1">
          {actions}
          {presence}
        </div>
      </div>
    </header>
  )
}
