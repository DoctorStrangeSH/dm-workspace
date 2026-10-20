'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from './button'

export interface EmptyStateAction {
  label: string
  onClick?: () => void
  href?: string
  variant?: 'primary' | 'secondary'
  icon?: React.ReactNode
}

export interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  actions?: EmptyStateAction[]
  size?: 'sm' | 'md' | 'lg'
  dashed?: boolean
  className?: string
}

const SIZES = {
  sm: {
    container: 'p-6',
    icon: 'text-3xl mb-2',
    title: 'text-sm font-medium',
    description: 'text-xs',
  },
  md: {
    container: 'p-10',
    icon: 'text-4xl mb-3',
    title: 'text-base font-semibold',
    description: 'text-sm',
  },
  lg: {
    container: 'p-14',
    icon: 'text-5xl mb-4',
    title: 'text-lg font-semibold',
    description: 'text-sm',
  },
}

export function EmptyState({
  icon,
  title,
  description,
  actions,
  size = 'md',
  dashed = true,
  className,
}: EmptyStateProps) {
  const s = SIZES[size]

  return (
    <div
      className={cn(
        'rounded-2xl text-center',
        dashed
          ? 'border-2 border-dashed border-[var(--border-default)]'
          : 'border border-[var(--border-default)] bg-[var(--bg-surface)]',
        s.container,
        className
      )}
    >
      {icon && (
        <div className={cn('select-none', s.icon)} aria-hidden>
          {icon}
        </div>
      )}

      <h3 className={cn(s.title, 'text-[var(--text-primary)]')}>{title}</h3>

      {description && (
        <p className={cn('mx-auto mt-1 max-w-md text-[var(--text-muted)]', s.description)}>
          {description}
        </p>
      )}

      {actions && actions.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {actions.map((action, i) => {
            const buttonVariant = action.variant ?? 'primary'

            if (action.href) {
              return (
                <Link key={i} href={action.href}>
                  <Button variant={buttonVariant} size="md" icon={action.icon}>
                    {action.label}
                  </Button>
                </Link>
              )
            }

            return (
              <Button
                key={i}
                variant={buttonVariant}
                size="md"
                icon={action.icon}
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Экспорт по умолчанию — для гибкости (можно импортить и так, и так)
export default EmptyState
