'use client'

import { forwardRef, useId } from 'react'
import { Check, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  hint?: string
  error?: string
  indeterminate?: boolean
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, hint, error, indeterminate, id, className, ...props }, ref) => {
    const generatedId = useId()
    const checkboxId = id ?? generatedId

    return (
      <div className="w-full">
        <div className="flex items-start gap-2.5">
          <div className="relative flex h-5 items-center">
            <input
              ref={ref}
              id={checkboxId}
              type="checkbox"
              aria-invalid={!!error}
              aria-describedby={
                error ? `${checkboxId}-error` : hint ? `${checkboxId}-hint` : undefined
              }
              className={cn(
                'peer h-4 w-4 shrink-0 appearance-none rounded border',
                'border-[var(--border-default)] bg-[var(--bg-primary)]',
                'transition-colors duration-150',
                'checked:border-[var(--accent)] checked:bg-[var(--accent)]',
                'indeterminate:border-[var(--accent)] indeterminate:bg-[var(--accent)]',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]',
                'disabled:cursor-not-allowed disabled:opacity-50',
                error && 'border-[var(--danger)]',
                className
              )}
              {...props}
            />
            <Check
              size={12}
              strokeWidth={3}
              className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100"
            />
            {indeterminate && (
              <Minus
                size={12}
                strokeWidth={3}
                className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white"
              />
            )}
          </div>

          {label && (
            <label
              htmlFor={checkboxId}
              className="cursor-pointer text-sm text-[var(--text-primary)] select-none"
            >
              {label}
            </label>
          )}
        </div>

        {error && (
          <p id={`${checkboxId}-error`} className="mt-1.5 ml-6.5 text-xs text-[var(--danger-text)]">
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={`${checkboxId}-hint`} className="mt-1.5 ml-6.5 text-xs text-[var(--text-muted)]">
            {hint}
          </p>
        )}
      </div>
    )
  }
)
Checkbox.displayName = 'Checkbox'
