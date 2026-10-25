'use client'

import { cn } from '@/lib/utils'

interface SelectOption {
  value: string
  label: string
}

interface Props {
  value: string | undefined
  onChange: (v: string | undefined) => void
  options: SelectOption[]
  disabled?: boolean
  label?: string
  placeholder?: string
  hint?: string
}

/**
 * CHANGES (К9):
 * - Убран импорт FieldOption из entity-schemas (тип изменился: {value, labelKey}).
 * - Свой локальный SelectOption {value, label} — SelectField получает УЖЕ переведённые label.
 * - slate/indigo → семантические токены.
 */
export default function SelectField({
  value,
  onChange,
  options,
  disabled,
  label,
  placeholder,
  hint,
}: Props) {
  return (
    <div>
      {label && (
        <label className="mb-1 block text-xs text-[var(--text-muted)]">
          {label}
          {hint && (
            <span className="ml-1 text-[var(--text-subtle)]" title={hint}>
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
          'w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-app)] px-3 py-2 text-sm text-[var(--text-primary)] transition focus:border-[var(--border-focus)] focus:outline-none',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        <option value="">{placeholder ?? '—'}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}
