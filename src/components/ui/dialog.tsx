'use client'

import { useEffect, useRef, useId } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { IconButton } from './button'

export interface DialogProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  footer?: React.ReactNode
  closeLabel?: string
  closeDisabled?: boolean
}

const SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md',
  footer,
  closeLabel = 'Закрыть',
  closeDisabled = false,
}: DialogProps) {
  const titleId = useId()
  const descriptionId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  // Escape + body scroll + focus trap
  useEffect(() => {
    if (!open) return

    // Запоминаем активный элемент, чтобы вернуть фокус
    previousActiveElement.current = document.activeElement as HTMLElement
    const previousOverflow = document.body.style.overflow

    // Focus trap
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }

      if (e.key === 'Tab') {
        const dialog = dialogRef.current
        if (!dialog) return

        const focusable = dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
        if (!focusable.length) {
          e.preventDefault()
          dialog.focus()
          return
        }
        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault()
            last?.focus()
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            first?.focus()
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    // Фокусируемся на диалоге
    const focusTimeout = setTimeout(() => {
      const dialog = dialogRef.current
      if (dialog) {
        const focusable = dialog.querySelector<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
        ;(focusable ?? dialog).focus()
      }
    }, 50)

    return () => {
      clearTimeout(focusTimeout)
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      // Возвращаем фокус
      previousActiveElement.current?.focus()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-overlay)] p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        className={cn(
          'flex max-h-[90vh] w-full flex-col rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-xl)]',
          SIZES[size]
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || description) && (
          <div className="flex items-start justify-between gap-4 border-b border-[var(--border-default)] p-4">
            <div className="min-w-0 flex-1">
              {title && (
                <h2 id={titleId} className="text-lg font-semibold text-[var(--text-primary)]">
                  {title}
                </h2>
              )}
              {description && (
                <p id={descriptionId} className="mt-0.5 text-sm text-[var(--text-muted)]">
                  {description}
                </p>
              )}
            </div>
            <IconButton label={closeLabel} size="sm" onClick={onClose} disabled={closeDisabled}>
              <X size={16} />
            </IconButton>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-[var(--border-default)] p-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
