'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

/** Native modal stays visible inside narrow session panes and native fullscreen. */
export default function CombatDrawer({
  label,
  onClose,
  blocked,
  children,
}: {
  label: string
  onClose: () => void
  blocked: boolean
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const [host, setHost] = useState<Element | null>(null)
  useEffect(() => {
    const update = () => setHost(document.fullscreenElement ?? document.body)
    update()
    document.addEventListener('fullscreenchange', update)
    return () => document.removeEventListener('fullscreenchange', update)
  }, [])
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    const opener = document.activeElement as HTMLElement | null
    dialog.showModal()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      const active = document.activeElement
      const restore = !active || active === document.body || dialog.contains(active)
      dialog.close()
      document.body.style.overflow = overflow
      if (restore && opener?.isConnected) opener.focus({ preventScroll: true })
    }
  }, [host])
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || ref.current?.querySelector('[aria-modal="true"]')) return
      event.preventDefault()
      if (!blocked) onClose()
    }
    window.addEventListener('keydown', keydown)
    return () => window.removeEventListener('keydown', keydown)
  }, [blocked, onClose])
  if (!host) return null
  return createPortal(
    <dialog
      ref={ref}
      aria-label={label}
      data-busy={blocked}
      className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-dvh w-full max-w-md overflow-y-auto border-0 bg-[var(--bg-elevated)] p-0 text-[var(--text-primary)] shadow-[var(--shadow-xl)] backdrop:bg-black/60"
      onKeyDownCapture={(event) => {
        const dialog = ref.current
        if (!dialog) return
        if (dialog.querySelector('[aria-modal="true"]')) {
          if (event.key === 'Escape') event.preventDefault()
          return
        }
        if (event.key !== 'Tab') return
        const focusable = [
          ...dialog.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          ),
        ].filter((el) => el.getClientRects().length > 0)
        const first = focusable[0],
          last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
      }}
      onCancel={(event) => {
        event.preventDefault()
        // The confirmation dialog owns Escape until it has closed.
        if (!blocked && !ref.current?.querySelector('[aria-modal="true"]')) onClose()
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget || blocked) return
        const r = event.currentTarget.getBoundingClientRect()
        if (
          event.clientX < r.left ||
          event.clientX > r.right ||
          event.clientY < r.top ||
          event.clientY > r.bottom
        )
          onClose()
      }}
    >
      {children}
    </dialog>,
    host
  )
}
