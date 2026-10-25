'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollText, X, Download, Trash2, Loader2 } from 'lucide-react'
import { clearLog } from '@/lib/actions/logs'
import { useToast } from '@/components/toast/toast-provider'
import { Button, Dialog, IconButton } from '@/components/ui'
import { useI18n } from '@/lib/i18n'
import { LOG_EVENT_LABELS } from '@/lib/types'
import type { SessionLogWithActor } from '@/lib/queries/logs'

interface Props {
  campaignId: string
  initialLog: SessionLogWithActor[]
  isDm: boolean
  onClose: () => void
}

function formatTime(iso: string, locale: string): string {
  return new Date(iso).toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function SessionLogPanel({ campaignId, initialLog, isDm, onClose }: Props) {
  const { t, lang } = useI18n()
  const locale = lang === 'ru' ? 'ru-RU' : 'en-US'
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const log = initialLog

  const handleExport = () => {
    const lines = log.map((entry) => {
      const time = new Date(entry.created_at).toLocaleString(locale)
      const actor = entry.actor?.display_name ?? entry.actor?.username ?? '?'
      return `${time} — ${actor}: ${entry.description}`
    })
    const content = `# ${t('logs.exportTitle')}\n\n${lines.join('\n')}`
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `session-log-${Date.now()}.md`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(t('logs.toast.exported'))
  }

  const handleClearConfirm = () => {
    startTransition(async () => {
      const res = await clearLog(campaignId)
      if ('error' in res) {
        toast.error(res.error ?? t('common.error'))
      } else {
        toast.success(t('logs.toast.cleared'))
        router.refresh()
      }
      setShowClearConfirm(false)
    })
  }

  return (
    <aside className="fixed top-0 right-0 z-40 flex h-screen w-full flex-col border-l border-[var(--border-default)] bg-[var(--bg-surface)] shadow-2xl sm:w-[420px]">
      <div className="flex items-center justify-between border-b border-[var(--border-default)] p-4">
        <div className="flex items-center gap-2">
          <ScrollText size={18} className="text-[var(--warning)]" />
          <h2 className="font-semibold text-[var(--text-primary)]">{t('logs.title')}</h2>
        </div>
        <IconButton variant="ghost" size="sm" label={t('common.close')} onClick={onClose}>
          <X size={18} />
        </IconButton>
      </div>

      <div className="flex items-center gap-2 border-b border-[var(--border-default)] p-3">
        <Button
          variant="secondary"
          size="sm"
          icon={<Download size={14} />}
          onClick={handleExport}
          disabled={log.length === 0}
          className="flex-1"
        >
          {t('logs.export')}
        </Button>
        {isDm && (
          <Button
            variant="danger"
            size="sm"
            icon={isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            onClick={() => setShowClearConfirm(true)}
            disabled={isPending || log.length === 0}
            title={t('logs.clear')}
          />
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {log.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--text-muted)]">{t('logs.empty')}</p>
        ) : (
          <div className="space-y-2">
            {log.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start gap-2 rounded-lg p-2 transition hover:bg-[var(--bg-hover)]/40"
              >
                <div className="w-10 shrink-0 text-xs text-[var(--text-subtle)] tabular-nums">
                  {formatTime(entry.created_at, locale)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-[var(--text-primary)]">{entry.description}</div>
                  <div className="mt-0.5 text-[10px] text-[var(--text-subtle)]">
                    {t(`logEvent.${entry.event_type}`) !== `logEvent.${entry.event_type}`
                      ? t(`logEvent.${entry.event_type}`)
                      : (LOG_EVENT_LABELS[entry.event_type] ?? entry.event_type)}{' '}
                    · {entry.actor?.display_name ?? entry.actor?.username ?? '?'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CHANGES: confirm() → Dialog */}
      <Dialog
        open={showClearConfirm}
        onClose={() => !isPending && setShowClearConfirm(false)}
        title={t('logs.clearConfirm.title')}
        description={t('logs.clearConfirm.description')}
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setShowClearConfirm(false)}
              disabled={isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button variant="danger" size="md" onClick={handleClearConfirm} loading={isPending}>
              {t('logs.clearConfirm.confirm')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-[var(--text-muted)]">{t('logs.clearConfirm.cannotUndo')}</p>
      </Dialog>
    </aside>
  )
}
