'use client'

import Link from 'next/link'
import { ChevronRight, Home, MoreHorizontal } from 'lucide-react'
import { Fragment } from 'react'
import { cn } from '@/lib/utils'

export interface BreadcrumbItem {
  label: string
  href?: string
  icon?: React.ReactNode
}

interface Props {
  items: BreadcrumbItem[]
  /** Сворачивать на мобиле (первый + ... + последние 2) */
  collapseOnMobile?: boolean
  className?: string
}

export function Breadcrumbs({ items, collapseOnMobile = true, className }: Props) {
  if (items.length === 0) return null

  // На мобиле сворачиваем: [Home] → ... → [предпоследний] → [текущий]
  const visible = (() => {
    if (!collapseOnMobile || items.length <= 3) return items
    return [items[0], ...items.slice(-2)]
  })()

  const hasHidden = visible.length < items.length

  return (
    <nav
      aria-label="Хлебные крошки"
      className={cn('flex min-w-0 items-center gap-1 text-sm', className)}
    >
      {visible.map((item, i) => {
        const isLastVisible = i === visible.length - 1

        return (
          <Fragment key={`${item.label}-${i}`}>
            {i > 0 && (
              <ChevronRight
                size={12}
                className="shrink-0"
                style={{ color: 'var(--text-subtle)' }}
              />
            )}

            {/* Многоточие после первого элемента, если есть скрытые */}
            {hasHidden && i === 0 && (
              <>
                <BreadcrumbLink item={item} isLast={false} />
                <ChevronRight
                  size={12}
                  className="shrink-0"
                  style={{ color: 'var(--text-subtle)' }}
                />
                <button
                  className="flex items-center rounded px-1 py-0.5 transition hover:bg-[var(--bg-secondary)]"
                  title={items
                    .slice(1, -2)
                    .map((it) => it.label)
                    .join(' → ')}
                  style={{ color: 'var(--text-subtle)' }}
                >
                  <MoreHorizontal size={12} />
                </button>
              </>
            )}

            {/* Сам элемент — если не многоточие */}
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
      <span
        className="min-w-0 truncate font-medium"
        style={{ color: 'var(--text-primary)' }}
        aria-current="page"
      >
        {content}
      </span>
    )
  }

  return (
    <Link
      href={item.href}
      className="min-w-0 truncate transition hover:underline"
      style={{ color: 'var(--text-muted)' }}
    >
      {content}
    </Link>
  )
}
