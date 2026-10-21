'use client'

import { useState, useTransition, useMemo } from 'react'
import { Plus, Link2 } from 'lucide-react'
import { deleteRelation } from '@/lib/actions/relations'
import { useToast } from '@/components/toast/toast-provider'
import { Button, EmptyState } from '@/components/ui'
import { RELATION_TYPES, type EntityRelation, type RelationType } from '@/lib/types'
import RelationChip from './relation-chip'
import AddRelationDialog from './add-relation-dialog'
import type { Entity } from '@/lib/types'

interface Props {
  entityId: string
  campaignId: string
  entityType: string
  relations: EntityRelation[]
  allEntities: Entity[]
  isDm: boolean
}

export default function EntityRelationsList({
  entityId,
  campaignId,
  entityType,
  relations,
  allEntities,
  isDm,
}: Props) {
  const toast = useToast()
  const [, startTransition] = useTransition()
  const [showDialog, setShowDialog] = useState(false)

  const grouped = useMemo(() => {
    const groups: Record<string, EntityRelation[]> = {}
    for (const r of relations) {
      const key = `${r.direction}:${r.relationType}`
      if (!groups[key]) groups[key] = []
      groups[key].push(r)
    }
    return groups
  }, [relations])

  const handleDelete = (relationId: string) => {
    startTransition(async () => {
      const res = await deleteRelation(relationId, campaignId)
      if ('error' in res) {
        toast.error(res.error ?? 'Ошибка')
      } else {
        toast.success('Связь удалена')
      }
    })
  }

  const outgoingRelations = relations
    .filter((r) => r.direction === 'outgoing')
    .map((r) => ({
      sourceId: r.sourceId,
      targetId: r.targetId,
      relationType: r.relationType,
    }))

  return (
    <div className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--text-primary)]">
          <Link2 size={18} className="text-[var(--text-muted)]" />
          Связи
          {relations.length > 0 && (
            <span className="text-sm font-normal text-[var(--text-subtle)]">
              ({relations.length})
            </span>
          )}
        </h2>
        {isDm && (
          <Button
            variant="secondary"
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => setShowDialog(true)}
          >
            Добавить
          </Button>
        )}
      </div>

      {entityType === 'location' && relations.length === 0 && isDm && (
        <div className="mb-4 rounded-lg border border-[var(--success)]/30 bg-[var(--success-subtle)] p-3">
          <p className="text-sm text-[var(--success-text)]">
            💡 <strong>Подсказка:</strong> добавь связь <strong>«Родительская локация»</strong> или{' '}
            <strong>«Находится в»</strong>, чтобы создать иерархию.
          </p>
        </div>
      )}

      {relations.length === 0 ? (
        <EmptyState
          icon="🔗"
          title="Связей пока нет"
          description={
            isDm
              ? 'Добавь связь с другой сущностью — например, NPC входит во фракцию или локация находится в регионе.'
              : 'Связей пока нет.'
          }
          size="sm"
          dashed={false}
        />
      ) : (
        <div className="space-y-3">
          {Object.entries(grouped).map(([key, items]) => {
            const [direction, relationType] = key.split(':') as [
              'outgoing' | 'incoming',
              RelationType,
            ]
            const info = RELATION_TYPES[relationType]
            const label = direction === 'outgoing' ? info.label : info.reverseLabel

            return (
              <div key={key}>
                <div className="mb-2 text-xs tracking-wider text-[var(--text-subtle)] uppercase">
                  {info.icon} {label}
                </div>
                <div className="flex flex-wrap gap-2">
                  {items.map((r) => (
                    <RelationChip
                      key={r.relationId}
                      relation={r}
                      campaignId={campaignId}
                      currentEntityId={entityId}
                      isDm={isDm}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showDialog && (
        <AddRelationDialog
          campaignId={campaignId}
          sourceEntity={allEntities.find((e) => e.id === entityId) as Entity}
          allEntities={allEntities}
          existingRelations={outgoingRelations}
          onClose={() => setShowDialog(false)}
        />
      )}
    </div>
  )
}
