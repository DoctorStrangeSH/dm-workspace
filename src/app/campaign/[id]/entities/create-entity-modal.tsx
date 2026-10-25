'use client'

import { useState, useTransition } from 'react'
import { createEntity } from '@/lib/actions/entities'
import { ENTITY_STYLES } from '@/lib/entity-ui'
import { useToast } from '@/components/toast/toast-provider'
import { cn } from '@/lib/utils'
import { Button, Dialog, Input, Textarea } from '@/components/ui'
import { useT } from '@/lib/i18n'
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
  const t = useT()
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

  const handleTypeChange = (type: EntityType) => {
    setSelectedType(type)
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
        setError(res.error ?? t('common.error'))
        toast.error(res.error ?? t('common.error'))
        return
      }
      toast.success(t('entities.toast.created'))
      onClose()
    })
  }

  const placeholderKey =
    selectedType === 'npc'
      ? 'entities.form.namePlaceholder.npc'
      : selectedType === 'location'
        ? 'entities.form.namePlaceholder.location'
        : selectedType === 'monster'
          ? 'entities.form.namePlaceholder.monster'
          : 'entities.form.namePlaceholder.other'

  return (
    <Dialog
      open={true}
      onClose={onClose}
      title={t('entities.create')}
      size="md"
      footer={
        <>
          <Button variant="secondary" size="md" onClick={onClose} disabled={isPending}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="primary"
            size="md"
            type="submit"
            form="create-entity-form"
            loading={isPending}
          >
            {t('common.create')}
          </Button>
        </>
      }
    >
      <form id="create-entity-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm text-[var(--text-secondary)]">
            {t('entities.form.type')} <span className="text-[var(--danger)]">*</span>
          </label>
          <div className="grid grid-cols-4 gap-2">
            {TYPE_OPTIONS.map((type) => {
              const style = ENTITY_STYLES[type]
              const active = selectedType === type
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleTypeChange(type)}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-lg border p-3 transition-colors',
                    active
                      ? 'border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--accent-text)]'
                      : 'border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--text-muted)] hover:border-[var(--border-hover)]'
                  )}
                >
                  <span className="text-xl">{style.icon}</span>
                  <span className="text-xs">{t(style.labelKey)}</span>
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

        <Input
          name="name"
          label={t('entities.form.name')}
          type="text"
          required
          minLength={2}
          maxLength={150}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t(placeholderKey)}
          autoFocus
        />

        <Textarea
          name="description"
          label={t('common.description')}
          rows={3}
          maxLength={5000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('entities.form.descriptionPlaceholder')}
        />

        {error && (
          <div className="rounded-lg border border-[var(--danger)]/30 bg-[var(--danger-subtle)] p-2 text-sm text-[var(--danger-text)]">
            {error}
          </div>
        )}
      </form>
    </Dialog>
  )
}
