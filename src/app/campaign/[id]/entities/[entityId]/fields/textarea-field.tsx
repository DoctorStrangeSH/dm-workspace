'use client'

import { cn } from '@/lib/utils'

interface Props {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  disabled?: boolean
  label?: string
  hint?: string
  rows?: number
}

export default function TextareaField({
  value,
  onChange,
  placeholder,
  disabled,
  label,
  hint,
  rows = 4,
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
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={cn(
          'w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition resize-y',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      />
    </div>
  )
}