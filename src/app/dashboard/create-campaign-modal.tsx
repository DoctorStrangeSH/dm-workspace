'use client'

import { useState, useTransition } from 'react'
import { createCampaign } from '@/lib/actions/campaigns'
import { GENRES } from '@/lib/types'
import { Button, Input, Textarea, Select, Dialog } from '@/components/ui'
import { useT } from '@/lib/i18n'

interface Props {
  onClose: () => void
  onSuccess?: () => void
}

export default function CreateCampaignModal({ onClose, onSuccess }: Props) {
  const t = useT()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // CHANGES: GENRES — данные (сохраняются в БД как есть).
  // value = label = строка. Тех-долг: мигрировать на enum + t('genre.*') в К8+.
  const GENRE_OPTIONS = [
    { value: '', label: t('campaign.genrePlaceholder') },
    ...GENRES.map((g) => ({ value: g, label: g })),
  ]

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const res = await createCampaign(formData)
      if ('error' in res) {
        setError(res.error ?? t('common.error'))
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
      title={t('campaign.createTitle')}
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
            form="create-campaign-form"
            loading={isPending}
          >
            {t('common.create')}
          </Button>
        </>
      }
    >
      <form id="create-campaign-form" onSubmit={handleSubmit} className="space-y-4">
        <Input
          name="name"
          label={t('campaign.form.name')}
          type="text"
          required
          minLength={2}
          maxLength={100}
          placeholder={t('campaign.form.namePlaceholder')}
          autoFocus
        />

        <Select
          name="genre"
          label={t('campaign.form.genre')}
          options={GENRE_OPTIONS}
          defaultValue=""
        />

        <Textarea
          name="description"
          label={t('common.description')}
          rows={4}
          maxLength={500}
          placeholder={t('campaign.form.descriptionPlaceholder')}
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
