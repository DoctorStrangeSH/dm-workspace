'use client'

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY_OPEN = 'dm-screen-open'
const STORAGE_KEY_RECENT = 'dm-screen-recent'

const MAX_RECENT = 8

export function useDmScreen() {
  const [isOpen, setIsOpen] = useState(false)
  const [recentIds, setRecentIds] = useState<string[]>([])

  // Загружаем состояние из localStorage при монтировании
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(STORAGE_KEY_OPEN)
      if (stored === 'true') setIsOpen(true)

      const recent = localStorage.getItem(STORAGE_KEY_RECENT)
      if (recent) setRecentIds(JSON.parse(recent))
    } catch {
      // ignore
    }
  }, [])

  // Сохраняем состояние панели
  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEY_OPEN, String(isOpen))
  }, [isOpen])

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((v) => !v), [])

  const addToRecent = useCallback((entityId: string) => {
    setRecentIds((prev) => {
      const next = [entityId, ...prev.filter((id) => id !== entityId)].slice(
        0,
        MAX_RECENT
      )
      try {
        localStorage.setItem(STORAGE_KEY_RECENT, JSON.stringify(next))
      } catch {
        // ignore
      }
      return next
    })
  }, [])

  return {
    isOpen,
    recentIds,
    open,
    close,
    toggle,
    addToRecent,
  }
}