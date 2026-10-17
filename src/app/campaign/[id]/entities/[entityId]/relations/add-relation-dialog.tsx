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
  const [selectedRelationType, setSelectedRelationType] =
    useState<RelationType | null>(null)

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
    return getAllowedRelations(
      sourceEntity.type,
      selectedTarget.type
    ).filter(
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
      if (res.error) {
        toast.error(res.error)
        setError(res.error)
        return
      }
      toast.success('Связь создана')
      onClose()
    })
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-slate-800">
          <h2 className="font-semibold">Добавить связь</h2>
          <button
            onClick={onClose}
            disabled={isPending}
            className="p-1 hover:bg-slate-800 rounded transition"
          >
            <X size={18} />
          </button>
        </div>

        {!selectedType && !selectedTarget && (
          <div className="p-4">
            <p className="text-sm text-slate-400 mb-3">
              С каким типом сущности связываем?
            </p>
            {availableTypes.length === 0 ? (
              <p className="text-slate-500 text-sm">
                Нет других сущностей в кампании
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {availableTypes.map((t) => {
                  const style = ENTITY_STYLES[t]
                  return (
                    <button
                      key={t}
                      onClick={() => setSelectedType(t)}
                      className={cn(
                        'flex flex-col items-center gap-1 p-3 rounded-lg border transition',
                        'bg-slate-950 border-slate-800 hover:border-indigo-600 text-slate-300'
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
          <div className="flex flex-col flex-1 min-h-0">
            <div className="p-4 border-b border-slate-800">
              <button
                onClick={() => setSelectedType(null)}
                className="text-xs text-slate-500 hover:text-white mb-2"
              >
                ← Изменить тип
              </button>
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  autoFocus
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Поиск..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <p className="text-center text-slate-500 text-sm py-8">
                  Ничего не найдено
                </p>
              ) : (
                filtered.map((e) => {
                  const style = ENTITY_STYLES[e.type]
                  return (
                    <button
                      key={e.id}
                      onClick={() => setSelectedTarget(e)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 transition text-left"
                    >
                      <span className="text-lg">{style.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-slate-200 truncate">
                          {e.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {style.label}
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        )}

        {selectedTarget && (
          <div className="p-4 overflow-y-auto">
            <button
              onClick={() => {
                setSelectedTarget(null)
                setSelectedRelationType(null)
              }}
              className="text-xs text-slate-500 hover:text-white mb-3"
            >
              ← Изменить сущность
            </button>
            <div className="flex items-center gap-2 mb-4 p-2 bg-slate-950 border border-slate-800 rounded-lg">
              <span>{ENTITY_STYLES[selectedTarget.type].icon}</span>
              <span className="text-sm font-medium">
                {selectedTarget.name}
              </span>
            </div>

            <p className="text-sm text-slate-400 mb-3">Тип связи:</p>
            {allowedRelationTypes.length === 0 ? (
              <p className="text-slate-500 text-sm">
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
                        'w-full flex items-center gap-2 px-3 py-2 rounded-lg border transition text-left',
                        selectedRelationType === rt
                          ? 'bg-indigo-950/60 border-indigo-600 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
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
              <div className="mt-3 text-red-400 text-sm bg-red-950/30 border border-red-900/50 rounded-lg p-2">
                {error}
              </div>
            )}

            {selectedRelationType && (
              <button
                onClick={handleSubmit}
                disabled={isPending}
                className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition font-medium disabled:opacity-50"
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