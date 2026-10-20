'use client'

import { forwardRef, useId } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  hint?: string
  error?: string
  options: SelectOption[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, hint, error, options, placeholder, id, className, ...props }, ref) => {
    const generatedId = useId()
    const selectId = id ?? generatedId

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]"
          >
            {label}
            {props.required && <span className="ml-0.5 text-[var(--danger)]">*</span>}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            aria-invalid={!!error}
            aria-describedby={error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined}
            className={cn(
              'w-full appearance-none rounded-lg border bg-[var(--bg-primary)] px-3 py-2 pr-9 text-sm text-[var(--text-primary)]',
              'transition-colors duration-150',
              'focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--accent)]/20 focus:outline-none',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error
                ? 'border-[var(--danger)] focus:border-[var(--danger)] focus:ring-[var(--danger)]/20'
                : 'border-[var(--border-default)] hover:border-[var(--border-hover)]',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[var(--text-muted)]"
          />
        </div>

        {error && (
          <p id={`${selectId}-error`} className="mt-1.5 text-xs text-[var(--danger-text)]">
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={`${selectId}-hint`} className="mt-1.5 text-xs text-[var(--text-muted)]">
            {hint}
          </p>
        )}
      </div>
    )
  }
)
Select.displayName = 'Select'
