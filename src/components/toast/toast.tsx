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
    bg: 'bg-green-950/40',
    border: 'border-green-800/60',
    text: 'text-green-300',
    bar: 'bg-green-500',
  },
  error: {
    icon: <AlertCircle size={18} />,
    bg: 'bg-red-950/40',
    border: 'border-red-800/60',
    text: 'text-red-300',
    bar: 'bg-red-500',
  },
  info: {
    icon: <Info size={18} />,
    bg: 'bg-indigo-950/40',
    border: 'border-indigo-800/60',
    text: 'text-indigo-300',
    bar: 'bg-indigo-500',
  },
  warning: {
    icon: <AlertTriangle size={18} />,
    bg: 'bg-amber-950/40',
    border: 'border-amber-800/60',
    text: 'text-amber-300',
    bar: 'bg-amber-500',
  },
}

export default function Toast({ toast, onClose }: Props) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const style = STYLES[toast.type]

  // Анимация появления
  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true))
  }, [])

  // Анимация исчезновения перед удалением
  const handleClose = () => {
    setIsLeaving(true)
    setTimeout(() => onClose(toast.id), 200)
  }

  // Прогресс-бар (если duration > 0)
  const showProgress = toast.duration > 0

  return (
    <div
      className={cn(
        'pointer-events-auto relative flex max-w-md min-w-[280px] items-start gap-3 overflow-hidden rounded-lg border p-3 pr-2 shadow-lg backdrop-blur-sm transition-all duration-200 ease-out',
        style.bg,
        style.border,
        isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      )}
    >
      {/* Иконка */}
      <div className={cn('mt-0.5 shrink-0', style.text)}>{style.icon}</div>

      {/* Контент */}
      <div className="min-w-0 flex-1">
        <div className={cn('text-sm font-medium', style.text)}>{toast.message}</div>
        {toast.description && (
          <div className="mt-0.5 text-xs text-slate-400">{toast.description}</div>
        )}
      </div>

      {/* Кнопка закрыть */}
      <button
        onClick={handleClose}
        className="shrink-0 rounded p-1 transition hover:bg-white/10"
        title="Закрыть"
      >
        <X size={14} className="text-slate-400" />
      </button>

      {/* Прогресс-бар */}
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
