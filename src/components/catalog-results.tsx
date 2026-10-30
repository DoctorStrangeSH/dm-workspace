'use client'

import { useRef, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import { Button, EmptyState } from '@/components/ui'
import { CATALOG_PAGE_SIZE, type CatalogPage } from '@/lib/srd/catalog-page'
import { useT } from '@/lib/i18n'

interface Props<T> {
  pending: boolean
  result: CatalogPage<T>
  page: number
  changePage: (page: number) => void
  retry: () => void
  emptyTitle: string
  emptyDescription: string
  icon: string
  children: (items: T[]) => ReactNode
}

export function CatalogResults<T>({
  pending,
  result,
  page,
  changePage,
  retry,
  emptyTitle,
  emptyDescription,
  icon,
  children,
}: Props<T>) {
  const t = useT()
  const top = useRef<HTMLDivElement>(null)
  const navigate = (next: number) => {
    changePage(next)
    top.current?.scrollIntoView({ block: 'start' })
    top.current?.focus({ preventScroll: true })
  }
  return (
    <div
      ref={top}
      tabIndex={-1}
      role="region"
      aria-label={t('catalog.results')}
      aria-busy={pending}
      className="scroll-mt-4 outline-none"
    >
      <p role="status" aria-live="polite" className="mb-4 text-sm text-[var(--text-muted)]">
        {pending
          ? t('catalog.loading')
          : result.ok && result.items.length
            ? t('catalog.range', {
                from: page * CATALOG_PAGE_SIZE + 1,
                to: page * CATALOG_PAGE_SIZE + result.items.length,
              })
            : ''}
      </p>
      {pending ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className="h-44 animate-pulse rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] motion-reduce:animate-none"
            />
          ))}
        </div>
      ) : !result.ok ? (
        <div
          role="alert"
          className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-6"
        >
          <p className="font-medium text-[var(--text-primary)]">{t('catalog.loadError')}</p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">{t('catalog.errorHint')}</p>
          <Button
            variant="secondary"
            icon={<RefreshCw size={16} />}
            className="mt-4 min-h-12"
            onClick={retry}
          >
            {t('catalog.retry')}
          </Button>
        </div>
      ) : result.items.length === 0 ? (
        <EmptyState icon={icon} title={emptyTitle} description={emptyDescription} size="md" />
      ) : (
        children(result.items)
      )}
      {!pending && result.ok && (page > 0 || result.hasNext) && (
        <nav
          aria-label={t('catalog.pagination')}
          className="mt-6 flex flex-wrap items-center justify-center gap-3"
        >
          <Button
            variant="secondary"
            className="min-h-12"
            icon={<ChevronLeft size={16} />}
            disabled={page === 0}
            onClick={() => navigate(page - 1)}
          >
            {t('catalog.previous')}
          </Button>
          <span className="text-sm text-[var(--text-muted)]">
            {t('catalog.page', { page: page + 1 })}
          </span>
          <Button
            variant="secondary"
            className="min-h-12"
            disabled={!result.hasNext}
            onClick={() => navigate(page + 1)}
          >
            {t('catalog.next')}
            <ChevronRight size={16} aria-hidden="true" />
          </Button>
        </nav>
      )}
    </div>
  )
}
