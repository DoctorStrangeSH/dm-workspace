'use client'

import { cn } from '@/lib/utils'

interface Props {
  value: number | undefined
  onChange: (v: number | undefined) => void
  placeholder?: string
  disabled?: boolean
  label?: string
  hint?: string
  min?: number
  max?: number
}

export default function NumberField({
  value,
  onChange,
  placeholder,
  disabled,
  label,
  hint,
  min,
  max,
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
      <input
        type="number"
        value={value ?? ''}
        onChange={(e) => {
          const raw = e.target.value
          if (raw === '') {
            onChange(undefined)
            return
          }
          const num = Number(raw)
          if (!isNaN(num)) onChange(num)
        }}
        placeholder={placeholder}
        disabled={disabled}
        min={min}
        max={max}
        className={cn(
          'w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      />
    </div>
  )
}