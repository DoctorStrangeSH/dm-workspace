'use client'

import Link from 'next/link'
import { ENTITY_STYLES } from '@/lib/entity-ui'
import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n'
import type { Entity } from '@/lib/types'

interface Props {
  entity: Entity
  campaignId: string
  onSelect: (entityId: string) => void
}

export default function DmEntityItem({ entity, campaignId, onSelect }: Props) {
  const t = useT()
  const style = ENTITY_STYLES[entity.type]

  return (
    <Link
      href={`/campaign/${campaignId}/entities/${entity.id}`}
      onClick={() => onSelect(entity.id)}
      className="group flex items-center gap-3 rounded-lg px-3 py-2 transition hover:bg-[var(--bg-hover)]"
    >
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-base',
          style.bg,
          style.border
        )}
      >
        {style.icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-[var(--text-primary)] transition group-hover:text-[var(--accent-text)]">
          {entity.name}
        </div>
        <div className="text-xs text-[var(--text-muted)]">{t(style.labelKey)}</div>
      </div>
    </Link>
  )
}
