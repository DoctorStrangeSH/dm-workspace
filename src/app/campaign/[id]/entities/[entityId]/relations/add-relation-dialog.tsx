'use client'

import { useState, useTransition, useMemo } from 'react'
import { Search } from 'lucide-react'
import { createRelation } from '@/lib/actions/relations'
import { ENTITY_STYLES } from '@/lib/entity-ui'
import { useToast } from '@/components/toast/toast-provider'
import { Button, Dialog, Input } from '@/components/ui'
import {
  RELATION_TYPES,
  getAllowedRelations,
  type EntityType,
  type RelationType,
  type Entity,
} from '@/lib/types'
import { cn } from '@/lib/utils'

interface Props {
  campaignId: string
  sourceEntity: Entity
  allEntities: Entity[]
  existingRelations: Array<{
    sourceId: string
    targetId: string
    relationType: RelationType
  }>
  onClose: () => void
}

export default function AddRelationDialog({
  campaignId,
  sourceEntity,
  allEntities,
  existingRelations,
  onClose,
}: Props) {
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [selectedType, setSelectedType] = useState<EntityType | null>(null)
  const [selectedTarget, setSelectedTarget] = useState<Entity | null>(null)
  const [selectedRelationType, setSelectedRelationType] = useState<RelationType | null>(null)

  const availableEntities = useMemo(
    () => allEntities.filter((e) => e.id !== sourceEntity.id),
    [allEntities, sourceEntity.id]
  )

  const filtered = useMemo(() => {
    let list = availableEntities
    if (selectedType) {
      list = list.filter((e) => e.type === selectedType)
    }
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter((e) => e.name.toLowerCase().includes(q))
    }
    return list
  }, [availableEntities, selectedType, query])

  const allowedRelationTypes = useMemo(() => {
    if (!selectedTarget) return []
    return getAllowedRelations(sourceEntity.type, selectedTarget.type).filter(
      (rt) =>
        !existingRelations.some(
          (r) =>
            r.sourceId === sourceEntity.id &&
            r.targetId === selectedTarget.id &&
            r.relationType === rt
        )
    )
  }, [sourceEntity, selectedTarget, existingRelations])

  const availableTypes = useMemo(() => {
    const types = new Set<EntityType>()
    availableEntities.forEach((e) => types.add(e.type))
    return Array.from(types)
  }, [availableEntities])

  const handleSubmit = () => {
    if (!selectedTarget || !selectedRelationType) {
      setError('Выбери сущность и тип связи')
      return
    }

    startTransition(async () => {
      const res = await createRelation(
        campaignId,
        sourceEntity.id,
        selectedTarget.id,
        selectedRelationType
      )
      if ('error' in res) {
        toast.error(res.error ?? 'Ошибка')
        setError(res.error ?? 'Ошибка')
        return
      }
      toast.success('Связь создана')
      onClose()
    })
  }

  return (
    <Dialog open={true} onClose={onClose} title="Добавить связь" size="md">
      {!selectedType && !selectedTarget && (
        <div>
          <p className="mb-3 text-sm text-[var(--text-muted)]">С каким типом сущности связываем?</p>
          {availableTypes.length === 0 ? (
            <p className="text-sm text-[var(--text-subtle)]">Нет других сущностей в кампании</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {availableTypes.map((t) => {
                const style = ENTITY_STYLES[t]
                return (
                  <button
                    key={t}
                    onClick={() => setSelectedType(t)}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-lg border p-3 transition-colors',
                      'border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:border-[var(--accent)]'
                    )}
                  >
                    <span className="text-xl">{style.icon}</span>
                    <span className="text-xs">{style.label}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {selectedType && !selectedTarget && (
        <div>
          <button
            onClick={() => setSelectedType(null)}
            className="mb-2 text-xs text-[var(--text-subtle)] hover:text-[var(--text-primary)]"
          >
            ← Изменить тип
          </button>
          <Input
            autoFocus
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск..."
            icon={<Search size={14} />}
            className="mb-3"
          />

          <div className="max-h-60 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-[var(--text-subtle)]">
                Ничего не найдено
              </p>
            ) : (
              filtered.map((e) => {
                const style = ENTITY_STYLES[e.type]
                return (
                  <button
                    key={e.id}
                    onClick={() => setSelectedTarget(e)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-[var(--bg-hover)]"
                  >
                    <span className="text-lg">{style.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm text-[var(--text-primary)]">{e.name}</div>
                      <div className="text-xs text-[var(--text-muted)]">{style.label}</div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}

      {selectedTarget && (
        <div>
          <button
            onClick={() => {
              setSelectedTarget(null)
              setSelectedRelationType(null)
            }}
            className="mb-3 text-xs text-[var(--text-subtle)] hover:text-[var(--text-primary)]"
          >
            ← Изменить сущность
          </button>
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] p-2">
            <span>{ENTITY_STYLES[selectedTarget.type].icon}</span>
            <span className="text-sm font-medium text-[var(--text-primary)]">
              {selectedTarget.name}
            </span>
          </div>

          <p className="mb-3 text-sm text-[var(--text-muted)]">Тип связи:</p>
          {allowedRelationTypes.length === 0 ? (
            <p className="text-sm text-[var(--text-subtle)]">
              Нет доступных типов связей (все уже добавлены)
            </p>
          ) : (
            <div className="space-y-1">
              {allowedRelationTypes.map((rt) => {
                const info = RELATION_TYPES[rt]
                return (
                  <button
                    key={rt}
                    onClick={() => setSelectedRelationType(rt)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors',
                      selectedRelationType === rt
                        ? 'border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--accent-text)]'
                        : 'border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]'
                    )}
                  >
                    <span>{info.icon}</span>
                    <span className="text-sm">{info.label}</span>
                  </button>
                )
              })}
            </div>
          )}

          {error && (
            <div className="mt-3 rounded-lg border border-[var(--danger)]/30 bg-[var(--danger-subtle)] p-2 text-sm text-[var(--danger-text)]">
              {error}
            </div>
          )}

          {selectedRelationType && (
            <Button
              variant="primary"
              size="md"
              onClick={handleSubmit}
              loading={isPending}
              className="mt-4 w-full"
            >
              Создать связь
            </Button>
          )}
        </div>
      )}
    </Dialog>
  )
}
