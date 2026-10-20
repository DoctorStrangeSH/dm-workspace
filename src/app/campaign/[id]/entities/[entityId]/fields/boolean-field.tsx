'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  value: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
  label?: string
  hint?: string
}

export default function BooleanField({ value, onChange, disabled, label, hint }: Props) {
  return (
    <div>
      {label && (
        <label className="mb-1 block text-xs text-slate-400">
          {label}
          {hint && (
            <span className="ml-1 text-slate-600" title={hint}>
              ⓘ
            </span>
          )}
        </label>
      )}
      <button
        type="button"
        onClick={() => !disabled && onChange(!value)}
        disabled={disabled}
        className={cn(
          'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition',
          value
            ? 'border-indigo-600 bg-indigo-950/60 text-indigo-300'
            : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        <div
          className={cn(
            'flex h-4 w-4 items-center justify-center rounded border transition',
            value ? 'border-indigo-500 bg-indigo-600' : 'border-slate-600'
          )}
        >
          {value && <Check size={12} className="text-white" />}
        </div>
        {value ? 'Да' : 'Нет'}
      </button>
    </div>
  )
}
