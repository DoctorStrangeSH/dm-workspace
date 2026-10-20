'use client'

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'command-palette-recent'

const MAX_RECENT = 5

export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false)

  // CHANGES: убран useEffect для чтения localStorage → lazy initializer.
  const [recentIds, setRecentIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? (JSON.parse(stored) as string[]) : []
    } catch {
      return []
    }
  })

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((v) => !v), [])

  const addRecent = useCallback((id: string) => {
    setRecentIds((prev) => {
      const next = [id, ...prev.filter((x) => x !== id)].slice(0, MAX_RECENT)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // ignore
      }
      return next
    })
  }, [])

  // Хоткей Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyK') {
        e.preventDefault()
        toggle()
      }
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault()
        close()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [toggle, close, isOpen])

  return {
    isOpen,
    recentIds,
    open,
    close,
    toggle,
    addRecent,
  }
}