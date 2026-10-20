'use client'

import { Check, Loader2, AlertCircle, Cloud } from 'lucide-react'

interface Props {
  status: 'idle' | 'saving' | 'saved' | 'error'
  lastSaved: Date | null
  error: string | null
}

export default function SaveStatus({ status, lastSaved, error }: Props) {
  if (status === 'saving') {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Loader2 size={14} className="animate-spin" />
        Сохранение...
      </div>
    )
  }

  if (status === 'saved') {
    return (
      <div className="flex items-center gap-2 text-sm text-green-400">
        <Check size={14} />
        Сохранено
        {lastSaved && (
          <span className="text-xs text-slate-500">
            {lastSaved.toLocaleTimeString('ru-RU', {
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
      <div className="flex items-center gap-2 text-sm text-red-400">
        <AlertCircle size={14} />
        {error ?? 'Ошибка'}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-sm text-slate-500">
      <Cloud size={14} />
      Автосохранение
    </div>
  )
}
