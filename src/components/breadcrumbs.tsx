'use client'

import Link from 'next/link'
import { ChevronRight, Home, MoreHorizontal } from 'lucide-react'
import { Fragment } from 'react'
import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n'

export interface BreadcrumbItem {
  label: string
  href?: string
  icon?: React.ReactNode
}

interface Props {
  items: BreadcrumbItem[]
  collapseOnMobile?: boolean
  className?: string
}

export function Breadcrumbs({ items, collapseOnMobile = true, className }: Props) {
  const t = useT()
  if (items.length === 0) return null

  const visible = (() => {
    if (!collapseOnMobile || items.length <= 3) return items
    return [items[0], ...items.slice(-2)]
  })()

  const hasHidden = visible.length < items.length

  return (
    <nav
      aria-label={t('nav.breadcrumbs')}
      className={cn('flex min-w-0 items-center gap-1 text-sm', className)}
    >
      {visible.map((item, i) => {
        const isLastVisible = i === visible.length - 1

        return (
          <Fragment key={`${item.label}-${i}`}>
            {i > 0 && <ChevronRight size={12} className="shrink-0 text-[var(--text-subtle)]" />}

            {hasHidden && i === 0 && (
              <>
                <BreadcrumbLink item={item} isLast={false} />
                <ChevronRight size={12} className="shrink-0 text-[var(--text-subtle)]" />
                <button
                  className="flex items-center rounded px-1 py-0.5 text-[var(--text-subtle)] transition-colors hover:bg-[var(--bg-secondary)]"
                  title={items
                    .slice(1, -2)
                    .map((it) => it.label)
                    .join(' → ')}
                >
                  <MoreHorizontal size={12} />
                </button>
              </>
            )}

            {(!hasHidden || i > 0) && <BreadcrumbLink item={item} isLast={isLastVisible} />}
          </Fragment>
        )
      })}
    </nav>
  )
}

function BreadcrumbLink({ item, isLast }: { item: BreadcrumbItem; isLast: boolean }) {
  const isHome = item.label === 'Дашборд' || item.label === 'На главную'

  const content = (
    <span className="flex max-w-[200px] items-center gap-1.5 truncate">
      {item.icon ?? (isHome && <Home size={12} />)}
      <span className="truncate">{item.label}</span>
    </span>
  )

  if (isLast || !item.href) {
    return (
      <span className="min-w-0 truncate font-medium text-[var(--text-primary)]" aria-current="page">
        {content}
      </span>
    )
  }

  return (
    <Link
      href={item.href}
      className="min-w-0 truncate text-[var(--text-muted)] transition hover:underline"
    >
      {content}
    </Link>
  )
}
