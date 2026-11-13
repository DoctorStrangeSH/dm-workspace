'use client'

import { useState, useTransition, useRef } from 'react'
import { createChapter } from '@/lib/actions/chapters'
import { useToast } from '@/components/toast/toast-provider'
import { useT } from '@/lib/i18n'
import { Button, Input, Dialog } from '@/components/ui'

interface Props {
  campaignId: string
  onClose: () => void
  initialTitle?: string
}

export default function CreateChapterModal({ campaignId, onClose, initialTitle = '' }: Props) {
  const t = useT()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const guard = useRef(false)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (guard.current) return
    guard.current = true
    setError(null)

    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      try {
        const res = await createChapter(campaignId, formData)
        if ('error' in res) {
          setError(res.error ?? t('common.error'))
          toast.error(res.error ?? t('common.error'))
          return
        }
        toast.success(t('chapters.toast.created'))
        onClose()
      } catch {
        setError(t('prep.chapterUncertain'))
      } finally {
        guard.current = false
      }
    })
  }

  return (
    <Dialog
      open
      title={t('chapters.create')}
      onClose={() => {
        if (!isPending) onClose()
      }}
      closeDisabled={isPending}
      closeLabel={t('common.close')}
    >
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
            defaultValue={initialTitle}
            type="text"
            required
            minLength={2}
            maxLength={150}
            placeholder={t('chapters.createPlaceholder')}
            autoFocus
          />
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-[var(--danger)]/40 bg-[var(--danger-subtle)] p-2 text-sm text-[var(--danger-text)]"
          >
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
    </Dialog>
  )
}
