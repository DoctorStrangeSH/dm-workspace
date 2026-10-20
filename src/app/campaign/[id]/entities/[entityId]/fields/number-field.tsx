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
          'w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white transition placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      />
    </div>
  )
}
