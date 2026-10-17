'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

interface ActionProps {
  label: string
  onClick?: () => void
  href?: string
  variant?: 'primary' | 'secondary'
  icon?: React.ReactNode
}

interface Props {
  /** Иконка (эмодзи или компонент) */
  icon?: React.ReactNode
  /** Заголовок */
  title: string
  /** Описание */
  description?: string
  /** Кнопки действий */
  actions?: ActionProps[]
  /** Размер */
  size?: 'sm' | 'md' | 'lg'
  /** Пунктирная рамка */
  dashed?: boolean
  /** Дополнительный класс */
  className?: string
}

export default function EmptyState({
  icon,
  title,
  description,
  actions,
  size = 'md',
  dashed = true,
  className,
}: Props) {
  const sizeClasses = {
    sm: {
      container: 'p-6',
      icon: 'text-3xl mb-2',
      title: 'text-sm font-medium',
      description: 'text-xs',
      action: 'px-3 py-1.5 text-xs',
    },
    md: {
      container: 'p-10',
      icon: 'text-4xl mb-3',
      title: 'text-base font-semibold',
      description: 'text-sm',
      action: 'px-4 py-2 text-sm',
    },
    lg: {
      container: 'p-14',
      icon: 'text-5xl mb-4',
      title: 'text-lg font-semibold',
      description: 'text-sm',
      action: 'px-4 py-2 text-sm',
    },
  }

  const s = sizeClasses[size]

  return (
    <div
      className={cn(
        'rounded-2xl text-center',
        dashed && 'border-2 border-dashed',
        s.container,
        className
      )}
      style={{
        borderColor: dashed ? 'var(--border-default)' : undefined,
        backgroundColor: dashed ? 'transparent' : 'var(--bg-primary)',
      }}
    >
      {icon && (
        <div className={cn('select-none', s.icon)} aria-hidden>
          {icon}
        </div>
      )}

      <h3 className={s.title} style={{ color: 'var(--text-primary)' }}>
        {title}
      </h3>

      {description && (
        <p
          className={cn('mt-1 max-w-md mx-auto', s.description)}
          style={{ color: 'var(--text-muted)' }}
        >
          {description}
        </p>
      )}

      {actions && actions.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {actions.map((action, i) => {
            const classes = cn(
              'inline-flex items-center gap-2 rounded-lg font-medium transition',
              s.action,
              action.variant === 'secondary'
                ? 'border'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            )

            const style =
              action.variant === 'secondary'
                ? {
                    borderColor: 'var(--border-default)',
                    color: 'var(--text-secondary)',
                  }
                : undefined

            if (action.href) {
              return (
                <Link
                  key={i}
                  href={action.href}
                  className={classes}
                  style={style}
                >
                  {action.icon}
                  {action.label}
                </Link>
              )
            }

            return (
              <button
                key={i}
                onClick={action.onClick}
                className={classes}
                style={style}
              >
                {action.icon}
                {action.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}