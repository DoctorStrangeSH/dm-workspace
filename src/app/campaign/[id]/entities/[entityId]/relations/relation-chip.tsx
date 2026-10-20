'use client'

import Link from 'next/link'
import { X } from 'lucide-react'
import { ENTITY_STYLES } from '@/lib/entity-ui'
import { RELATION_TYPES } from '@/lib/types'
import { cn } from '@/lib/utils'
import type { EntityRelation } from '@/lib/types'

interface Props {
  relation: EntityRelation
  campaignId: string
  currentEntityId: string
  isDm: boolean
  onDelete?: (relationId: string) => void
}

export default function RelationChip({
  relation,
  campaignId,
  isDm,
  onDelete,
}: Props) {
  const isOutgoing = relation.direction === 'outgoing'
  const other = isOutgoing
    ? {
        id: relation.targetId,
        name: relation.targetName,
        type: relation.targetType,
      }
    : {
        id: relation.sourceId,
        name: relation.sourceName,
        type: relation.sourceType,
      }

  const relationInfo = RELATION_TYPES[relation.relationType]
  const label = isOutgoing
    ? relationInfo.label
    : relationInfo.reverseLabel

  const style = ENTITY_STYLES[other.type]

  return (
    <div className="group inline-flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-full bg-slate-900 border border-slate-800 hover:border-slate-700 transition">
      <span className="text-xs text-slate-500">{label}</span>
      <Link
        href={`/campaign/${campaignId}/entities/${other.id}`}
        className={cn(
          'flex items-center gap-1 px-1.5 text-xs font-medium transition hover:opacity-80',
          style.color
        )}
      >
        <span>{style.icon}</span>
        <span>{other.name}</span>
      </Link>
      {isDm && onDelete && (
        <button
          onClick={() => onDelete(relation.relationId)}
          className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-950/50 rounded-full transition"
          title="Удалить связь"
        >
          <X size={10} className="text-red-400" />
        </button>
      )}
    </div>
  )
}