'use client'

import Link from 'next/link'
import { X } from 'lucide-react'
import { ENTITY_STYLES } from '@/lib/entity-ui'
import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n'
import type { EntityRelation } from '@/lib/types'

interface Props {
  relation: EntityRelation
  campaignId: string
  currentEntityId: string
  isDm: boolean
  onDelete?: (relationId: string) => void
}

export default function RelationChip({ relation, campaignId, isDm, onDelete }: Props) {
  const t = useT()
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

  const labelKey = isOutgoing
    ? `relationType.${relation.relationType}.label`
    : `relationType.${relation.relationType}.reverse`

  const style = ENTITY_STYLES[other.type]

  return (
    <div className="group inline-flex items-center gap-1.5 rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] py-1 pr-1 pl-2.5 transition-colors hover:border-[var(--border-hover)]">
      <span className="text-xs text-[var(--text-subtle)]">{t(labelKey)}</span>
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
          className="rounded-full p-0.5 opacity-0 transition group-hover:opacity-100 hover:bg-[var(--danger-subtle)]"
          title={t('entities.relations.deleteHint')}
        >
          <X size={10} className="text-[var(--danger)]" />
        </button>
      )}
    </div>
  )
}
