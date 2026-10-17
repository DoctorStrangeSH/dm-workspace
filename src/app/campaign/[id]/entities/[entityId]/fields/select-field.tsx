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
        <label className="block text-xs text-slate-400 mb-1">
          {label}
          {hint && (
            <span className="text-slate-600 ml-1" title={hint}>
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
          'w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 transition',
          disabled && 'opacity-50 cursor-not-allowed'
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