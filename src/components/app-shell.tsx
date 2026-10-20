'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface AppShellProps {
  /** Заголовок в topbar */
  title?: string
  /** Подзаголовок (например, email, роль) */
  subtitle?: string
  /** Ссылка «назад» (если есть — показывается стрелка) */
  backHref?: string
  /** Контент слева от заголовка (например, аватар) */
  leading?: React.ReactNode
  /** Контент справа в topbar (кнопки, меню) */
  actions?: React.ReactNode
  /** Контент страницы */
  children: React.ReactNode
  /** Максимальная ширина контента (для центрирования) */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  /** Дополнительный класс для main */
  className?: string
}

const MAX_WIDTHS = {
  sm: 'max-w-2xl',
  md: 'max-w-3xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
  full: 'max-w-none',
}

/**
 * Единый каркас для простых страниц (dashboard, settings, join).
 * Для сложных (campaign, VTT) — свой layout.
 */
export function AppShell({
  title,
  subtitle,
  backHref,
  leading,
  actions,
  children,
  maxWidth = 'xl',
  className,
}: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-app)]">
      {/* Topbar */}
      <header className="sticky top-0 z-30 border-b border-[var(--border-default)] bg-[var(--bg-app)]/95 backdrop-blur">
        <div
          className={cn('mx-auto flex items-center gap-3 px-4 py-3 sm:px-6', MAX_WIDTHS[maxWidth])}
        >
          {backHref && (
            <Link
              href={backHref}
              aria-label="Назад"
              className={cn(
                'inline-flex h-8 w-8 items-center justify-center rounded-md',
                'text-[var(--text-secondary)] transition-colors',
                'hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]'
              )}
            >
              <ArrowLeft size={18} />
            </Link>
          )}

          {leading && <div className="shrink-0">{leading}</div>}

          {(title || subtitle) && (
            <div className="min-w-0 flex-1">
              {title && (
                <h1 className="truncate text-base font-bold text-[var(--text-primary)] sm:text-lg">
                  {title}
                </h1>
              )}
              {subtitle && <p className="truncate text-xs text-[var(--text-muted)]">{subtitle}</p>}
            </div>
          )}

          {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
        </div>
      </header>

      {/* Content */}
      <main
        className={cn(
          'mx-auto w-full flex-1 px-4 py-6 sm:px-6 sm:py-8',
          MAX_WIDTHS[maxWidth],
          className
        )}
      >
        {children}
      </main>
    </div>
  )
}
