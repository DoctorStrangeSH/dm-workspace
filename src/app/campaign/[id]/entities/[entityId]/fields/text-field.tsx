'use client'

import { cn } from '@/lib/utils'

interface Props {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  disabled?: boolean
  label?: string
  hint?: string
}

export default function TextField({ value, onChange, placeholder, disabled, label, hint }: Props) {
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
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          'w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white transition placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      />
    </div>
  )
}
