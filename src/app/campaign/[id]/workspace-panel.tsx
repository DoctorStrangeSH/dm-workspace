'use client'

import { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'
import { useT } from '@/lib/i18n'
import { CampaignTools } from './campaign-tools'

/** Modal on small screens; an adjacent, nonmodal workspace on wide screens. */
export function WorkspacePanel({
  id,
  open,
  onClose,
  title,
  description,
  isDm,
  children,
}: {
  id: string
  open: boolean
  onClose: () => void
  title: string
  description: string
  isDm: boolean
  children: React.ReactNode
}) {
  const t = useT()
  const titleId = useId()
  const dialogRef = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (!open) {
      dialog.close()
      return
    }
    const wide = window.matchMedia('(min-width: 1280px)')
    const previousOverflow = document.body.style.overflow
    const sync = () => {
      if (dialog.open) dialog.close()
      document.body.style.overflow = wide.matches ? previousOverflow : 'hidden'
      if (wide.matches) dialog.show()
      else dialog.showModal()
    }
    sync()
    const handleEscape = (event: KeyboardEvent) => {
      // A nested confirmation dialog owns its own Escape key.
      if (
        event.key === 'Escape' &&
        !event.defaultPrevented &&
        !dialog.querySelector('[aria-modal="true"]')
      ) {
        event.preventDefault()
        onClose()
      }
    }
    wide.addEventListener('change', sync)
    window.addEventListener('keydown', handleEscape)
    return () => {
      wide.removeEventListener('change', sync)
      window.removeEventListener('keydown', handleEscape)
      dialog.close()
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  return (
    <dialog
      ref={dialogRef}
      id={id}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        if (!event.currentTarget.querySelector('[aria-modal="true"]')) onClose()
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
          onClose()
      }}
      className="fixed inset-y-0 right-0 left-auto z-40 m-0 hidden h-dvh max-h-none w-full max-w-[26rem] flex-col border-0 border-l border-[var(--border-default)] bg-[var(--bg-surface)] p-0 text-[var(--text-primary)] shadow-[var(--shadow-xl)] backdrop:bg-black/50 backdrop:backdrop-blur-sm open:flex"
    >
      <header className="shrink-0 space-y-4 border-b border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id={titleId} className="text-lg font-bold tracking-tight">
              {title}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--border-default)] text-[var(--text-muted)] transition hover:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <CampaignTools isDm={isDm} />
      </header>
      {children}
    </dialog>
  )
}
