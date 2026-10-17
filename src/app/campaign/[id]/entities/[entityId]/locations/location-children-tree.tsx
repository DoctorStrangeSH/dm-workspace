'use client'

import Link from 'next/link'
import { ChevronRight, FolderTree } from 'lucide-react'
import { ENTITY_STYLES } from '@/lib/entity-ui'
import { cn } from '@/lib/utils'

interface Descendant {
  entityId: string
  entityName: string
  depth: number
}

interface Props {
  campaignId: string
  descendants: Descendant[]
  /** Тип дочерних сущностей (обычно location) */
  entityType?: 'location'
}

export default function LocationChildrenTree({
  campaignId,
  descendants,
}: Props) {
  if (descendants.length === 0) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 text-center">
        <FolderTree size={24} className="text-slate-700 mx-auto mb-2" />
        <p className="text-sm text-slate-500">
          Нет вложенных локаций
        </p>
      </div>
    )
  }

  const style = ENTITY_STYLES.location

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4">
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
        <FolderTree size={14} />
        <span>
          Вложенные локации ({descendants.length})
        </span>
      </div>

      <div className="space-y-1">
        {descendants.map((d) => (
          <Link
            key={d.entityId}
            href={`/campaign/${campaignId}/entities/${d.entityId}`}
            className="group flex items-center gap-2 py-1.5 px-2 rounded hover:bg-slate-800/60 transition"
            style={{ paddingLeft: `${(d.depth - 1) * 16 + 8}px` }}
          >
            {d.depth > 1 && (
              <ChevronRight size={12} className="text-slate-600 shrink-0" />
            )}
            <span className={cn('text-sm', style.color)}>
              {style.icon}
            </span>
            <span className="text-sm text-slate-300 group-hover:text-white transition truncate">
              {d.entityName}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}