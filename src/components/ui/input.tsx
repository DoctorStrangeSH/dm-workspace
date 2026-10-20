'use client'

import { forwardRef, useId } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
  icon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, icon, id, className, ...props }, ref) => {
    const generatedId = useId()
    const inputId = id ?? generatedId

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]"
          >
            {label}
            {props.required && <span className="ml-0.5 text-[var(--danger)]">*</span>}
          </label>
        )}

        <div className="relative">
          {icon && (
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--text-muted)]">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            className={cn(
              'w-full rounded-lg border bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)]',
              'placeholder:text-[var(--text-subtle)]',
              'transition-colors duration-150',
              'focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--accent)]/20 focus:outline-none',
              'disabled:cursor-not-allowed disabled:opacity-50',
              icon && 'pl-10',
              error
                ? 'border-[var(--danger)] focus:border-[var(--danger)] focus:ring-[var(--danger)]/20'
                : 'border-[var(--border-default)] hover:border-[var(--border-hover)]',
              className
            )}
            {...props}
          />
        </div>

        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-xs text-[var(--danger-text)]">
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-[var(--text-muted)]">
            {hint}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

// ─── Textarea ───
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, id, className, ...props }, ref) => {
    const generatedId = useId()
    const inputId = id ?? generatedId

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]"
          >
            {label}
            {props.required && <span className="ml-0.5 text-[var(--danger)]">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          className={cn(
            'w-full rounded-lg border bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)]',
            'placeholder:text-[var(--text-subtle)]',
            'transition-colors duration-150',
            'focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--accent)]/20 focus:outline-none',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'resize-y',
            error
              ? 'border-[var(--danger)] focus:border-[var(--danger)] focus:ring-[var(--danger)]/20'
              : 'border-[var(--border-default)] hover:border-[var(--border-hover)]',
            className
          )}
          {...props}
        />

        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-xs text-[var(--danger-text)]">
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-[var(--text-muted)]">
            {hint}
          </p>
        )}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'
