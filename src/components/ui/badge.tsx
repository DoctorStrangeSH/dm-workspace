'use client'

import { cn } from '@/lib/utils'

export type BadgeVariant = 'accent' | 'success' | 'danger' | 'warning' | 'neutral'
export type BadgeSize = 'sm' | 'md'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  size?: BadgeSize
  icon?: React.ReactNode
}

const VARIANTS: Record<BadgeVariant, string> = {
  accent: 'bg-[var(--accent-subtle)] text-[var(--accent-text)] border border-[var(--accent)]/30',
  success:
    'bg-[var(--success-subtle)] text-[var(--success-text)] border border-[var(--success)]/30',
  danger: 'bg-[var(--danger-subtle)] text-[var(--danger-text)] border border-[var(--danger)]/30',
  warning:
    'bg-[var(--warning-subtle)] text-[var(--warning-text)] border border-[var(--warning)]/30',
  neutral:
    'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-default)]',
}

const SIZES: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-[10px] gap-1',
  md: 'px-2 py-0.5 text-xs gap-1.5',
}

export function Badge({
  variant = 'neutral',
  size = 'md',
  icon,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium whitespace-nowrap',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  )
}
