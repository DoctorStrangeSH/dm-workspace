'use client'

import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { ENTITY_STYLES } from '@/lib/entity-ui'
import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n'
import type { EntityType } from '@/lib/types'

interface PathItem {
  entityId: string
  entityName: string
  entityType: EntityType
}

interface Props {
  campaignId: string
  path: PathItem[]
}

export default function LocationBreadcrumbs({ campaignId, path }: Props) {
  const t = useT()

  if (path.length <= 1) return null

  return (
    <nav className="mb-4 flex flex-wrap items-center gap-1 text-sm">
      <Link
        href={`/campaign/${campaignId}/entities`}
        className="flex items-center gap-1 text-[var(--text-subtle)] transition hover:text-[var(--text-secondary)]"
      >
        <Home size={12} />
        <span>{t('nav.entities')}</span>
      </Link>

      {path.map((item, i) => {
        const isLast = i === path.length - 1
        const style = ENTITY_STYLES[item.entityType]

        return (
          <span key={item.entityId} className="flex items-center gap-1">
            <ChevronRight size={12} className="text-[var(--text-subtle)]" />
            {isLast ? (
              <span className={cn('font-medium', style.color)}>
                {style.icon} {item.entityName}
              </span>
            ) : (
              <Link
                href={`/campaign/${campaignId}/entities/${item.entityId}`}
                className="text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
              >
                {style.icon} {item.entityName}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
