'use client'

import Link from 'next/link'
import { ChevronRight, FolderTree } from 'lucide-react'
import { ENTITY_STYLES } from '@/lib/entity-ui'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/components/ui'
import { useT } from '@/lib/i18n'

interface Descendant {
  entityId: string
  entityName: string
  depth: number
}

interface Props {
  campaignId: string
  descendants: Descendant[]
  entityType?: 'location'
}

export default function LocationChildrenTree({ campaignId, descendants }: Props) {
  const t = useT()

  if (descendants.length === 0) {
    return (
      <EmptyState
        icon="📁"
        title={t('entities.locations.empty.title')}
        description={t('entities.locations.empty.description')}
        size="sm"
        dashed={false}
      />
    )
  }

  const style = ENTITY_STYLES.location

  return (
    <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)]/60 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm text-[var(--text-muted)]">
        <FolderTree size={14} />
        <span>{t('entities.locations.nested', { n: descendants.length })}</span>
      </div>

      <div className="space-y-1">
        {descendants.map((d) => (
          <Link
            key={d.entityId}
            href={`/campaign/${campaignId}/entities/${d.entityId}`}
            className="group flex items-center gap-2 rounded px-2 py-1.5 transition-colors hover:bg-[var(--bg-hover)]/60"
            style={{ paddingLeft: `${(d.depth - 1) * 16 + 8}px` }}
          >
            {d.depth > 1 && (
              <ChevronRight size={12} className="shrink-0 text-[var(--text-subtle)]" />
            )}
            <span className={cn('text-sm', style.color)}>{style.icon}</span>
            <span className="truncate text-sm text-[var(--text-secondary)] transition group-hover:text-[var(--text-primary)]">
              {d.entityName}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
