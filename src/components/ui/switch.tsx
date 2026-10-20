'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface SwitchProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'onChange'
> {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label?: string
  size?: 'sm' | 'md'
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked, onCheckedChange, label, size = 'md', disabled, className, ...props }, ref) => {
    const sizes = {
      sm: { track: 'h-5 w-9', thumb: 'h-4 w-4', translate: 'translate-x-4' },
      md: { track: 'h-6 w-11', thumb: 'h-5 w-5', translate: 'translate-x-5' },
    }
    const s = sizes[size]

    return (
      <div className="flex items-center gap-2.5">
        <button
          ref={ref}
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label={label}
          disabled={disabled}
          onClick={() => onCheckedChange(!checked)}
          className={cn(
            'relative inline-flex shrink-0 items-center rounded-full transition-colors duration-200',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]',
            'disabled:cursor-not-allowed disabled:opacity-50',
            s.track,
            checked ? 'bg-[var(--accent)]' : 'bg-[var(--bg-tertiary)]',
            className
          )}
          {...props}
        >
          <span
            className={cn(
              'pointer-events-none inline-block rounded-full bg-white shadow-sm transition-transform duration-200',
              s.thumb,
              checked ? s.translate : 'translate-x-0.5'
            )}
          />
        </button>

        {label && <span className="text-sm text-[var(--text-primary)] select-none">{label}</span>}
      </div>
    )
  }
)
Switch.displayName = 'Switch'
