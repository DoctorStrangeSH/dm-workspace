'use client'

import Link from 'next/link'
import { ENTITY_STYLES } from '@/lib/entity-ui'
import { cn } from '@/lib/utils'
import type { Entity } from '@/lib/types'

interface Props {
  entity: Entity
  campaignId: string
  onSelect: (entityId: string) => void
}

export default function DmEntityItem({ entity, campaignId, onSelect }: Props) {
  const style = ENTITY_STYLES[entity.type]

  return (
    <Link
      href={`/campaign/${campaignId}/entities/${entity.id}`}
      onClick={() => onSelect(entity.id)}
      className="group flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/60 transition"
    >
      <div
        className={cn(
          'shrink-0 w-8 h-8 rounded-lg border flex items-center justify-center text-base',
          style.bg,
          style.border
        )}
      >
        {style.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-slate-200 truncate group-hover:text-indigo-300 transition">
          {entity.name}
        </div>
        <div className="text-xs text-slate-500">{style.label}</div>
      </div>
    </Link>
  )
}