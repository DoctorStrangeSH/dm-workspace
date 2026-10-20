'use client'

import { useState, useTransition, useMemo } from 'react'
import { X, Search } from 'lucide-react'
import { createRelation } from '@/lib/actions/relations'
import { ENTITY_STYLES } from '@/lib/entity-ui'
import { useToast } from '@/components/toast/toast-provider'
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-2xl border border-slate-800 bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-800 p-4">
          <h2 className="font-semibold">Добавить связь</h2>
          <button
            onClick={onClose}
            disabled={isPending}
            className="rounded p-1 transition hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {!selectedType && !selectedTarget && (
          <div className="p-4">
            <p className="mb-3 text-sm text-slate-400">С каким типом сущности связываем?</p>
            {availableTypes.length === 0 ? (
              <p className="text-sm text-slate-500">Нет других сущностей в кампании</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {availableTypes.map((t) => {
                  const style = ENTITY_STYLES[t]
                  return (
                    <button
                      key={t}
                      onClick={() => setSelectedType(t)}
                      className={cn(
                        'flex flex-col items-center gap-1 rounded-lg border p-3 transition',
                        'border-slate-800 bg-slate-950 text-slate-300 hover:border-indigo-600'
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
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="border-b border-slate-800 p-4">
              <button
                onClick={() => setSelectedType(null)}
                className="mb-2 text-xs text-slate-500 hover:text-white"
              >
                ← Изменить тип
              </button>
              <div className="relative">
                <Search
                  size={14}
                  className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-500"
                />
                <input
                  autoFocus
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Поиск..."
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 pr-3 pl-9 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">Ничего не найдено</p>
              ) : (
                filtered.map((e) => {
                  const style = ENTITY_STYLES[e.type]
                  return (
                    <button
                      key={e.id}
                      onClick={() => setSelectedTarget(e)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-slate-800"
                    >
                      <span className="text-lg">{style.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm text-slate-200">{e.name}</div>
                        <div className="text-xs text-slate-500">{style.label}</div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        )}

        {selectedTarget && (
          <div className="overflow-y-auto p-4">
            <button
              onClick={() => {
                setSelectedTarget(null)
                setSelectedRelationType(null)
              }}
              className="mb-3 text-xs text-slate-500 hover:text-white"
            >
              ← Изменить сущность
            </button>
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 p-2">
              <span>{ENTITY_STYLES[selectedTarget.type].icon}</span>
              <span className="text-sm font-medium">{selectedTarget.name}</span>
            </div>

            <p className="mb-3 text-sm text-slate-400">Тип связи:</p>
            {allowedRelationTypes.length === 0 ? (
              <p className="text-sm text-slate-500">
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
                        'flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left transition',
                        selectedRelationType === rt
                          ? 'border-indigo-600 bg-indigo-950/60 text-white'
                          : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
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
              <div className="mt-3 rounded-lg border border-red-900/50 bg-red-950/30 p-2 text-sm text-red-400">
                {error}
              </div>
            )}

            {selectedRelationType && (
              <button
                onClick={handleSubmit}
                disabled={isPending}
                className="mt-4 w-full rounded-lg bg-indigo-600 py-2 font-medium transition hover:bg-indigo-500 disabled:opacity-50"
              >
                {isPending ? 'Создаём...' : 'Создать связь'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
