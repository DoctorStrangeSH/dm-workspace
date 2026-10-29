'use client'

import { AlertTriangle, Download, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui'
import { useToast } from '@/components/toast/toast-provider'
import { useT } from '@/lib/i18n'
import type { Character } from '@/lib/types'

export default function HPValidationNotice({ character }: { character: Character }) {
  const t = useT()
  const router = useRouter()
  const toast = useToast()
  const raw: unknown = character.data_json.hp
  const fields =
    raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : null
  const describe = (value: unknown) => {
    if (value === undefined || value === null) return t('characters.hp.missing')
    if (typeof value === 'number') return String(value)
    if (typeof value === 'string')
      return '«' + value.slice(0, 120) + (value.length > 120 ? '…' : '') + '»'
    return t('characters.hp.invalidFormat')
  }
  const downloadBackup = () => {
    try {
      const blob = new Blob(
        [JSON.stringify({ exportedAt: new Date().toISOString(), character }, null, 2)],
        { type: 'application/json' }
      )
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'character-' + character.id + '-backup.json'
      document.body.appendChild(link)
      link.click()
      link.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch {
      toast.error(t('characters.hp.backupFailed'))
    }
  }
  return (
    <section
      id="character-hp-notice"
      aria-labelledby="character-hp-notice-title"
      className="mb-5 rounded-xl border border-[var(--warning)]/40 bg-[var(--warning-subtle)] p-4 sm:p-5"
    >
      <div role="alert" className="flex items-start gap-3">
        <AlertTriangle
          size={20}
          className="mt-0.5 shrink-0 text-[var(--warning-text)]"
          aria-hidden="true"
        />
        <div className="min-w-0">
          <h2 id="character-hp-notice-title" className="font-semibold text-[var(--text-primary)]">
            {t('characters.hp.invalidTitle')}
          </h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {t('characters.hp.invalidDescription')}
          </p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            {t('characters.hp.recoveryHint')}
          </p>
        </div>
      </div>
      <details className="mt-3 text-sm text-[var(--text-secondary)]">
        <summary className="min-h-11 cursor-pointer py-3 font-medium">
          {t('characters.hp.savedValues')}
        </summary>
        <dl className="grid gap-2 rounded-lg border border-[var(--border-default)] p-3 sm:grid-cols-3">
          {(['current', 'max', 'temp'] as const).map((key) => (
            <div key={key} className="min-w-0">
              <dt className="text-xs text-[var(--text-muted)]">{t('characters.hp.' + key)}</dt>
              <dd className="mt-1 break-words">
                {key === 'temp' && fields && fields.temp === undefined
                  ? t('characters.hp.legacyTemp')
                  : describe(fields?.[key])}
              </dd>
            </div>
          ))}
        </dl>
      </details>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="md"
          icon={<Download size={16} />}
          onClick={downloadBackup}
        >
          {t('characters.hp.downloadBackup')}
        </Button>
        <Button
          variant="ghost"
          size="md"
          icon={<RefreshCw size={16} />}
          onClick={() => router.refresh()}
        >
          {t('characters.hp.refresh')}
        </Button>
      </div>
    </section>
  )
}
