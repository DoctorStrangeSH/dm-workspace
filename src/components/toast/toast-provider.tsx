'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from 'react'
import Toast from './toast'
import type { ToastItem, ToastOptions, ToastType } from '@/lib/toast-types'

interface ToastContextValue {
  success: (message: string, options?: ToastOptions) => string
  error: (message: string, options?: ToastOptions) => string
  info: (message: string, options?: ToastOptions) => string
  warning: (message: string, options?: ToastOptions) => string
  dismiss: (id: string) => void
  dismissAll: () => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const DEFAULT_DURATION = 4000
const MAX_TOASTS = 5

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  const dismiss = useCallback((id: string) => {
    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const dismissAll = useCallback(() => {
    timersRef.current.forEach((timer) => clearTimeout(timer))
    timersRef.current.clear()
    setToasts([])
  }, [])

  const show = useCallback(
    (type: ToastType, message: string, options: ToastOptions = {}) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const duration = options.duration ?? DEFAULT_DURATION

      const newToast: ToastItem = {
        id,
        type,
        message,
        description: options.description,
        duration,
        createdAt: Date.now(),
      }

      // Ограничиваем количество одновременных
      setToasts((prev) => {
        const next = [...prev, newToast]
        if (next.length > MAX_TOASTS) {
          const removed = next.shift()!
          const timer = timersRef.current.get(removed.id)
          if (timer) {
            clearTimeout(timer)
            timersRef.current.delete(removed.id)
          }
        }
        return next
      })

      // Автоскрытие
      if (duration > 0) {
        const timer = setTimeout(() => {
          dismiss(id)
        }, duration)
        timersRef.current.set(id, timer)
      }

      return id
    },
    [dismiss]
  )

  const success = useCallback(
    (message: string, options?: ToastOptions) =>
      show('success', message, options),
    [show]
  )
  const error = useCallback(
    (message: string, options?: ToastOptions) =>
      show('error', message, options),
    [show]
  )
  const info = useCallback(
    (message: string, options?: ToastOptions) =>
      show('info', message, options),
    [show]
  )
  const warning = useCallback(
    (message: string, options?: ToastOptions) =>
      show('warning', message, options),
    [show]
  )

  return (
    <ToastContext.Provider
      value={{ success, error, info, warning, dismiss, dismissAll }}
    >
      {children}

      {/* Контейнер тостов */}
      <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none sm:bottom-6 sm:right-6">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onClose={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return ctx
}