'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollText, X, Download, Trash2, Loader2 } from 'lucide-react'
import { clearLog } from '@/lib/actions/logs'
import { useToast } from '@/components/toast/toast-provider'
import { LOG_EVENT_LABELS } from '@/lib/types'
import type { SessionLogWithActor } from '@/lib/queries/logs'

interface Props {
  campaignId: string
  initialLog: SessionLogWithActor[]
  isDm: boolean
  onClose: () => void
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function SessionLogPanel({ campaignId, initialLog, isDm, onClose }: Props) {
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const log = initialLog

  const handleExport = () => {
    const lines = log.map((entry) => {
      const time = new Date(entry.created_at).toLocaleString('ru-RU')
      const actor = entry.actor?.display_name ?? entry.actor?.username ?? '?'
      return `${time} — ${actor}: ${entry.description}`
    })
    const content = `# Лог сессии\n\n${lines.join('\n')}`
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `session-log-${Date.now()}.md`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Лог экспортирован')
  }

  const handleClear = () => {
    if (!confirm('Очистить весь лог?')) return
    startTransition(async () => {
      const res = await clearLog(campaignId)
      if ('error' in res) toast.error(res.error ?? 'Ошибка')
      else {
        toast.success('Лог очищен')
        router.refresh()
      }
    })
  }

  return (
    <aside className="fixed top-0 right-0 z-40 flex h-screen w-full flex-col border-l border-slate-800 bg-slate-900 shadow-2xl sm:w-[420px]">
      <div className="flex items-center justify-between border-b border-slate-800 p-4">
        <div className="flex items-center gap-2">
          <ScrollText size={18} className="text-amber-400" />
          <h2 className="font-semibold">Записи сессии</h2>
        </div>
        <button onClick={onClose} className="rounded p-1 hover:bg-slate-800">
          <X size={18} />
        </button>
      </div>

      {/* Действия */}
      <div className="flex items-center gap-2 border-b border-slate-800 p-3">
        <button
          onClick={handleExport}
          disabled={log.length === 0}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-slate-700 disabled:opacity-50"
        >
          <Download size={14} />
          Экспорт (.md)
        </button>
        {isDm && (
          <button
            onClick={handleClear}
            disabled={isPending || log.length === 0}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-1.5 text-sm text-red-300 transition hover:bg-red-950/60 disabled:opacity-50"
            title="Очистить"
          >
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          </button>
        )}
      </div>

      {/* Список */}
      <div className="flex-1 overflow-y-auto p-3">
        {log.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">Пока нет записей</p>
        ) : (
          <div className="space-y-2">
            {log.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start gap-2 rounded-lg p-2 transition hover:bg-slate-800/40"
              >
                <div className="w-10 shrink-0 text-xs text-slate-600 tabular-nums">
                  {formatTime(entry.created_at)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-slate-200">{entry.description}</div>
                  <div className="mt-0.5 text-[10px] text-slate-500">
                    {LOG_EVENT_LABELS[entry.event_type] ?? entry.event_type} ·{' '}
                    {entry.actor?.display_name ?? entry.actor?.username ?? '?'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}
