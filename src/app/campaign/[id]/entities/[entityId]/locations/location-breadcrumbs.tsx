'use client'

import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { ENTITY_STYLES } from '@/lib/entity-ui'
import { cn } from '@/lib/utils'
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
  if (path.length <= 1) return null

  return (
    <nav className="flex items-center flex-wrap gap-1 text-sm mb-4">
      <Link
        href={`/campaign/${campaignId}/entities`}
        className="flex items-center gap-1 text-slate-500 hover:text-slate-300 transition"
      >
        <Home size={12} />
        <span>Сущности</span>
      </Link>

      {path.map((item, i) => {
        const isLast = i === path.length - 1
        const style = ENTITY_STYLES[item.entityType]

        return (
          <span key={item.entityId} className="flex items-center gap-1">
            <ChevronRight size={12} className="text-slate-600" />
            {isLast ? (
              <span className={cn('font-medium', style.color)}>
                {style.icon} {item.entityName}
              </span>
            ) : (
              <Link
                href={`/campaign/${campaignId}/entities/${item.entityId}`}
                className="text-slate-400 hover:text-white transition"
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