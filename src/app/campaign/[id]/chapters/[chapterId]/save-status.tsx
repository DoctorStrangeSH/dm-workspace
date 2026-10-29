'use client'

import { Check, Loader2, AlertCircle, Cloud } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

interface Props {
  status: 'idle' | 'saving' | 'saved' | 'error'
  lastSaved: Date | null
  error: string | null
}

export default function SaveStatus({ status, lastSaved, error }: Props) {
  const { t, lang } = useI18n()
  const locale = lang === 'ru' ? 'ru-RU' : 'en-US'

  if (status === 'saving') {
    return (
      <div
        role="status"
        className="flex min-w-0 flex-wrap items-center gap-2 text-sm text-[var(--text-muted)]"
      >
        <Loader2 size={14} className="animate-spin" />
        {t('chapters.save.saving')}
      </div>
    )
  }

  if (status === 'saved') {
    return (
      <div
        role="status"
        className="flex min-w-0 flex-wrap items-center gap-2 text-sm text-[var(--success-text)]"
      >
        <Check size={14} />
        {t('chapters.save.saved')}
        {lastSaved && (
          <span className="text-xs text-[var(--text-subtle)]">
            {lastSaved.toLocaleTimeString(locale, {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        )}
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div
        role="alert"
        className="flex min-w-0 flex-wrap items-center gap-2 text-sm [overflow-wrap:anywhere] break-words text-[var(--danger-text)]"
      >
        <AlertCircle size={14} />
        {error ?? t('common.error')}
      </div>
    )
  }

  return (
    <div
      role="status"
      className="flex min-w-0 flex-wrap items-center gap-2 text-sm text-[var(--text-subtle)]"
    >
      <Cloud size={14} />
      {t('chapters.save.autosave')}
    </div>
  )
}
