'use client'

import { useState, useTransition } from 'react'
import { X } from 'lucide-react'
import { createChapter } from '@/lib/actions/chapters'
import { useToast } from '@/components/toast/toast-provider'
import { useT } from '@/lib/i18n'
import { Button, Input, IconButton } from '@/components/ui'

interface Props {
  campaignId: string
  onClose: () => void
}

export default function CreateChapterModal({ campaignId, onClose }: Props) {
  const t = useT()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const res = await createChapter(campaignId, formData)
      if ('error' in res) {
        setError(res.error ?? t('common.error'))
        toast.error(res.error ?? t('common.error'))
        return
      }
      toast.success(t('chapters.toast.created'))
      onClose()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-overlay)] p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">{t('chapters.create')}</h2>
          <IconButton
            variant="ghost"
            size="sm"
            label={t('common.close')}
            onClick={onClose}
            disabled={isPending}
          >
            <X size={20} />
          </IconButton>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="chapter-title"
              className="mb-1 block text-sm text-[var(--text-secondary)]"
            >
              {t('common.name')} <span className="text-[var(--danger)]">*</span>
            </label>
            <Input
              id="chapter-title"
              name="title"
              type="text"
              required
              minLength={2}
              maxLength={150}
              placeholder={t('chapters.createPlaceholder')}
              autoFocus
            />
          </div>

          {error && (
            <div className="rounded-lg border border-[var(--danger)]/40 bg-[var(--danger-subtle)] p-2 text-sm text-[var(--danger-text)]">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={onClose}
              disabled={isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="primary" size="md" loading={isPending}>
              {isPending ? t('chapters.creating') : t('common.create')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
