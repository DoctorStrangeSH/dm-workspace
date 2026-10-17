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

export default function BooleanField({
  value,
  onChange,
  disabled,
  label,
  hint,
}: Props) {
  return (
    <div>
      {label && (
        <label className="block text-xs text-slate-400 mb-1">
          {label}
          {hint && (
            <span className="text-slate-600 ml-1" title={hint}>
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
          'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition',
          value
            ? 'bg-indigo-950/60 border-indigo-600 text-indigo-300'
            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <div
          className={cn(
            'w-4 h-4 rounded border flex items-center justify-center transition',
            value
              ? 'bg-indigo-600 border-indigo-500'
              : 'border-slate-600'
          )}
        >
          {value && <Check size={12} className="text-white" />}
        </div>
        {value ? 'Да' : 'Нет'}
      </button>
    </div>
  )
}