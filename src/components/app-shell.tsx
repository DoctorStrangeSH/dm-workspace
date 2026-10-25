'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n'

export interface AppShellProps {
  title?: string
  subtitle?: string
  backHref?: string
  leading?: React.ReactNode
  actions?: React.ReactNode
  children: React.ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  className?: string
}

const MAX_WIDTHS = {
  sm: 'max-w-2xl',
  md: 'max-w-3xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
  full: 'max-w-none',
}

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
  const t = useT()

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-app)]">
      <header className="sticky top-0 z-30 border-b border-[var(--border-default)] bg-[var(--bg-app)]/95 backdrop-blur">
        <div
          className={cn('mx-auto flex items-center gap-3 px-4 py-3 sm:px-6', MAX_WIDTHS[maxWidth])}
        >
          {backHref && (
            <Link
              href={backHref}
              aria-label={t('common.back')}
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
