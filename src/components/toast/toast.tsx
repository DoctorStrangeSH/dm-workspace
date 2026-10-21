'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ToastItem, ToastType } from '@/lib/toast-types'

interface Props {
  toast: ToastItem
  onClose: (id: string) => void
}

const STYLES: Record<
  ToastType,
  { icon: React.ReactNode; bg: string; border: string; text: string; bar: string }
> = {
  success: {
    icon: <CheckCircle2 size={18} />,
    bg: 'bg-[var(--success-subtle)]',
    border: 'border-[var(--success)]/40',
    text: 'text-[var(--success-text)]',
    bar: 'bg-[var(--success)]',
  },
  error: {
    icon: <AlertCircle size={18} />,
    bg: 'bg-[var(--danger-subtle)]',
    border: 'border-[var(--danger)]/40',
    text: 'text-[var(--danger-text)]',
    bar: 'bg-[var(--danger)]',
  },
  info: {
    icon: <Info size={18} />,
    bg: 'bg-[var(--accent-subtle)]',
    border: 'border-[var(--accent)]/40',
    text: 'text-[var(--accent-text)]',
    bar: 'bg-[var(--accent)]',
  },
  warning: {
    icon: <AlertTriangle size={18} />,
    bg: 'bg-[var(--warning-subtle)]',
    border: 'border-[var(--warning)]/40',
    text: 'text-[var(--warning-text)]',
    bar: 'bg-[var(--warning)]',
  },
}

export default function Toast({ toast, onClose }: Props) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const style = STYLES[toast.type]

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true))
  }, [])

  const handleClose = () => {
    setIsLeaving(true)
    setTimeout(() => onClose(toast.id), 200)
  }

  const showProgress = toast.duration > 0

  return (
    <div
      className={cn(
        'pointer-events-auto relative flex max-w-md min-w-[280px] items-start gap-3 overflow-hidden rounded-lg border p-3 pr-2 shadow-[var(--shadow-lg)] backdrop-blur-sm transition-all duration-200 ease-out',
        style.bg,
        style.border,
        isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      )}
    >
      <div className={cn('mt-0.5 shrink-0', style.text)}>{style.icon}</div>

      <div className="min-w-0 flex-1">
        <div className={cn('text-sm font-medium', style.text)}>{toast.message}</div>
        {toast.description && (
          <div className="mt-0.5 text-xs text-[var(--text-muted)]">{toast.description}</div>
        )}
      </div>

      <button
        onClick={handleClose}
        className="shrink-0 rounded p-1 transition hover:bg-white/10"
        title="Закрыть"
      >
        <X size={14} className="text-[var(--text-muted)]" />
      </button>

      {showProgress && (
        <div className="absolute right-0 bottom-0 left-0 h-0.5 bg-white/5">
          <div
            className={cn('h-full', style.bar)}
            style={{
              animation: `toast-progress ${toast.duration}ms linear forwards`,
            }}
          />
        </div>
      )}
    </div>
  )
}
