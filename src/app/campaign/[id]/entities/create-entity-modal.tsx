'use client'

import { useState, useTransition } from 'react'
import { X } from 'lucide-react'
import { createEntity } from '@/lib/actions/entities'
import { ENTITY_STYLES } from '@/lib/entity-ui'
import type { EntityType } from '@/lib/types'
import { cn } from '@/lib/utils'

interface Props {
  campaignId: string
  defaultType?: EntityType
  onClose: () => void
}

const TYPE_OPTIONS: EntityType[] = [
  'npc',
  'location',
  'item',
  'monster',
  'faction',
  'quest',
  'note',
]

export default function CreateEntityModal({
  campaignId,
  defaultType = 'npc',
  onClose,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<EntityType>(defaultType)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)
    // Принудительно ставим выбранный тип
    formData.set('type', selectedType)

    startTransition(async () => {
      const res = await createEntity(campaignId, formData)
      if (res.error) {
        setError(res.error)
        return
      }
      onClose()
    })
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Новая сущность</h2>
          <button
            onClick={onClose}
            disabled={isPending}
            className="p-1 hover:bg-slate-800 rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Выбор типа */}
          <div>
            <label className="block text-sm text-slate-300 mb-2">
              Тип <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {TYPE_OPTIONS.map((t) => {
                const style = ENTITY_STYLES[t]
                const active = selectedType === t
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedType(t)}
                    className={cn(
                      'flex flex-col items-center gap-1 p-3 rounded-lg border transition',
                      active
                        ? 'bg-indigo-950/60 border-indigo-600 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    )}
                  >
                    <span className="text-xl">{style.icon}</span>
                    <span className="text-xs">{style.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Имя */}
          <div>
            <label className="block text-sm text-slate-300 mb-1">
              Имя <span className="text-red-400">*</span>
            </label>
            <input
              name="name"
              type="text"
              required
              minLength={2}
              maxLength={150}
              placeholder={
                selectedType === 'npc'
                  ? 'Гэндальф'
                  : selectedType === 'location'
                    ? 'Шир'
                    : selectedType === 'monster'
                      ? 'Гоблин'
                      : 'Название...'
              }
              autoFocus
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Описание */}
          <div>
            <label className="block text-sm text-slate-300 mb-1">
              Описание
            </label>
            <textarea
              name="description"
              rows={4}
              maxLength={5000}
              placeholder="Краткое описание..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-950/30 border border-red-900/50 rounded-lg p-2">
              {error}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition disabled:opacity-50 font-medium"
            >
              {isPending ? 'Создаём...' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}