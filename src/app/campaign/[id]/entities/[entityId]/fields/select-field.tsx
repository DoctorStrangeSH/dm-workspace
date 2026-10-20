'use client'

import { cn } from '@/lib/utils'
import type { FieldOption } from '@/lib/entity-schemas'

interface Props {
  value: string | undefined
  onChange: (v: string | undefined) => void
  options: FieldOption[]
  disabled?: boolean
  label?: string
  placeholder?: string
  hint?: string
}

export default function SelectField({
  value,
  onChange,
  options,
  disabled,
  label,
  placeholder = '— Не выбрано —',
  hint,
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
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        disabled={disabled}
        className={cn(
          'w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white transition focus:border-indigo-500 focus:outline-none',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}
