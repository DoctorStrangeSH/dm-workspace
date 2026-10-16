'use client'

import { useEffect, useRef } from 'react'

interface HotkeyOptions {
  /**
   * Код клавиши (event.code) — не зависит от раскладки.
   * Например: 'KeyM', 'KeyS', 'BracketLeft', 'Escape', 'Enter'
   */
  code: string
  ctrl?: boolean
  meta?: boolean
  shift?: boolean
  alt?: boolean
  /**
   * Не срабатывать, если фокус в input/textarea/contenteditable.
   * По умолчанию true. Escape всегда работает.
   */
  ignoreInInputs?: boolean
  handler: (e: KeyboardEvent) => void
}

/**
 * Универсальный хук для хоткеев, работающий на любой раскладке.
 * Использует event.code, а не event.key.
 */
export function useHotkey({
  code,
  ctrl = false,
  meta = false,
  shift = false,
  alt = false,
  ignoreInInputs = true,
  handler,
}: HotkeyOptions) {
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      // Игнорируем, если фокус в input/textarea/contenteditable
      if (ignoreInInputs) {
        const target = e.target as HTMLElement | null
        if (target) {
          const tag = target.tagName.toLowerCase()
          if (
            tag === 'input' ||
            tag === 'textarea' ||
            target.isContentEditable
          ) {
            // Escape работает всегда
            if (e.code !== 'Escape') return
          }
        }
      }

      // ctrl = Ctrl (Win/Linux) ИЛИ Cmd (Mac)
      const ctrlOk = ctrl ? e.ctrlKey || e.metaKey : true
      const metaOk = meta ? e.metaKey : true
      const shiftOk = shift ? e.shiftKey : true
      const altOk = alt ? e.altKey : true

      // Если ни ctrl, ни meta не требуются — не срабатываем
      // на Ctrl+key / Cmd+key
      if (!ctrl && !meta && (e.ctrlKey || e.metaKey)) return

      if (e.code === code && ctrlOk && metaOk && shiftOk && altOk) {
        handlerRef.current(e)
      }
    }

    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [code, ctrl, meta, shift, alt, ignoreInInputs])
}