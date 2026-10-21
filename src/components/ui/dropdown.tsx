'use client'

import { useEffect, useRef, useState, useId } from 'react'
import { cn } from '@/lib/utils'

export interface DropdownItem {
  label: string
  onClick?: () => void
  icon?: React.ReactNode
  variant?: 'default' | 'danger'
  disabled?: boolean
}

export interface DropdownProps {
  trigger: React.ReactNode
  items: DropdownItem[]
  align?: 'left' | 'right'
}

export function Dropdown({ trigger, items, align = 'left' }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const ref = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  // Закрытие по клику снаружи
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Клавиатурная навигация
  useEffect(() => {
    if (!open) return

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        setActiveIndex(-1)
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((i) => {
          const next = i + 1
          return next >= items.length ? 0 : next
        })
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((i) => {
          const next = i - 1
          return next < 0 ? items.length - 1 : next
        })
      } else if (e.key === 'Enter' && activeIndex >= 0) {
        e.preventDefault()
        const item = items[activeIndex]
        if (item && !item.disabled) {
          item.onClick?.()
          setOpen(false)
          setActiveIndex(-1)
        }
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, activeIndex, items])

  // Фокус на активный item
  useEffect(() => {
    if (!open || activeIndex < 0) return
    const menu = menuRef.current
    if (!menu) return
    const buttons = menu.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')
    buttons[activeIndex]?.focus()
  }, [open, activeIndex])

  return (
    <div ref={ref} className="relative inline-block">
      <div
        onClick={() => {
          setOpen((v) => !v)
          setActiveIndex(-1)
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
      >
        {trigger}
      </div>

      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-orientation="vertical"
          className={cn(
            'absolute z-40 mt-1 min-w-[180px] overflow-hidden rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] py-1 shadow-[var(--shadow-lg)]',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          {items.map((item, i) => (
            <button
              key={i}
              role="menuitem"
              type="button"
              disabled={item.disabled}
              onClick={() => {
                item.onClick?.()
                setOpen(false)
                setActiveIndex(-1)
              }}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors',
                'focus-visible:bg-[var(--bg-hover)] focus-visible:outline-none',
                'disabled:cursor-not-allowed disabled:opacity-50',
                item.variant === 'danger'
                  ? 'text-[var(--danger-text)] hover:bg-[var(--danger-subtle)]'
                  : 'text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
              )}
            >
              {item.icon && <span aria-hidden="true">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
