'use client'

import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  label?: string
}

const SIZES = {
  sm: 14,
  md: 20,
  lg: 32,
}

export function Spinner({ size = 'md', className, label }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label ?? 'Загрузка'}
      className={cn('inline-flex items-center justify-center', className)}
    >
      <Loader2 size={SIZES[size]} className="animate-spin text-[var(--text-muted)]" />
      {label && <span className="sr-only">{label}</span>}
    </span>
  )
}

// ─── Полноэкранный спиннер ───
export function FullPageSpinner({ label }: { label?: string }) {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <Spinner size="lg" label={label} />
    </div>
  )
}
