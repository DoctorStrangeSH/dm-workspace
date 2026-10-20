'use client'

import { useState, useTransition } from 'react'
import { X } from 'lucide-react'
import { createEntity } from '@/lib/actions/entities'
import { ENTITY_STYLES } from '@/lib/entity-ui'
import { useToast } from '@/components/toast/toast-provider'
import { cn } from '@/lib/utils'
import TemplateSelect from './create-entity-modal/template-select'
import type { EntityTemplate, EntityType } from '@/lib/types'

interface Props {
  campaignId: string
  defaultType?: EntityType
  templates: EntityTemplate[]
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
  templates,
  onClose,
}: Props) {
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<EntityType>(defaultType)
  const [selectedTemplate, setSelectedTemplate] = useState<EntityTemplate | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const handleSelectTemplate = (template: EntityTemplate | null) => {
    setSelectedTemplate(template)
    if (template) {
      if (!name) setName(template.name)
      if (!description) setDescription(template.description)
    }
  }

  const handleTypeChange = (t: EntityType) => {
    setSelectedType(t)
    setSelectedTemplate(null)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)
    formData.set('type', selectedType)

    if (selectedTemplate) {
      formData.set('data_json', JSON.stringify(selectedTemplate.dataJson ?? {}))
    }

    startTransition(async () => {
      const res = await createEntity(campaignId, formData)
      if ('error' in res) {
        setError(res.error ?? 'Ошибка')
        toast.error(res.error ?? 'Ошибка')
        return
      }
      toast.success('Сущность создана')
      onClose()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
      <div className="my-auto w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">Новая сущность</h2>
          <button
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg p-1 transition hover:bg-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm text-slate-300">
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
                    onClick={() => handleTypeChange(t)}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-lg border p-3 transition',
                      active
                        ? 'border-indigo-600 bg-indigo-950/60 text-white'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    )}
                  >
                    <span className="text-xl">{style.icon}</span>
                    <span className="text-xs">{style.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <TemplateSelect
            templates={templates}
            selectedId={selectedTemplate?.id ?? null}
            onSelect={handleSelectTemplate}
            type={selectedType}
          />

          <div>
            <label className="mb-1 block text-sm text-slate-300">
              Имя <span className="text-red-400">*</span>
            </label>
            <input
              name="name"
              type="text"
              required
              minLength={2}
              maxLength={150}
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-300">Описание</label>
            <textarea
              name="description"
              rows={3}
              maxLength={5000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Краткое описание..."
              className="w-full resize-none rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-2 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-lg bg-slate-800 px-4 py-2 transition hover:bg-slate-700 disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-indigo-600 px-4 py-2 font-medium transition hover:bg-indigo-500 disabled:opacity-50"
            >
              {isPending ? 'Создаём...' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
