export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastItem {
  id: string
  type: ToastType
  message: string
  description?: string
  duration: number
  createdAt: number
}

export interface ToastOptions {
  description?: string
  /** Длительность в мс. 0 = не скрывать автоматически */
  duration?: number
}
