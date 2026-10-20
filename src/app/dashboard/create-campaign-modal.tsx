'use client'

import { useState, useTransition } from 'react'
import { createCampaign } from '@/lib/actions/campaigns'
import { GENRES } from '@/lib/types'
import { Button, Input, Textarea, Select, Dialog } from '@/components/ui'

interface Props {
  onClose: () => void
  onSuccess?: () => void
}

const GENRE_OPTIONS = [
  { value: '', label: '— Не выбран —' },
  ...GENRES.map((g) => ({ value: g, label: g })),
]

export default function CreateCampaignModal({ onClose, onSuccess }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const res = await createCampaign(formData)
      if ('error' in res) {
        setError(res.error ?? 'Ошибка')
        return
      }
      onSuccess?.()
      onClose()
    })
  }

  return (
    <Dialog
      open={true}
      onClose={onClose}
      title="Новая кампания"
      size="md"
      footer={
        <>
          <Button variant="secondary" size="md" onClick={onClose} disabled={isPending}>
            Отмена
          </Button>
          <Button
            variant="primary"
            size="md"
            type="submit"
            form="create-campaign-form"
            loading={isPending}
          >
            Создать
          </Button>
        </>
      }
    >
      <form id="create-campaign-form" onSubmit={handleSubmit} className="space-y-4">
        <Input
          name="name"
          label="Название"
          type="text"
          required
          minLength={2}
          maxLength={100}
          placeholder="Проклятие Страда"
          autoFocus
        />

        <Select name="genre" label="Жанр" options={GENRE_OPTIONS} defaultValue="" />

        <Textarea
          name="description"
          label="Описание"
          rows={4}
          maxLength={500}
          placeholder="Краткое описание кампании..."
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
