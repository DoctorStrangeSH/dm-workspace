'use client'

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY_OPEN = 'dm-screen-open'
const STORAGE_KEY_RECENT = 'dm-screen-recent'

const MAX_RECENT = 8

export function useDmScreen() {
  // CHANGES: убран useEffect для чтения localStorage → lazy initializer.
  // На SSR возвращаем false / [], на клиенте — из localStorage.
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    try {
      return localStorage.getItem(STORAGE_KEY_OPEN) === 'true'
    } catch {
      return false
    }
  })

  const [recentIds, setRecentIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const recent = localStorage.getItem(STORAGE_KEY_RECENT)
      return recent ? (JSON.parse(recent) as string[]) : []
    } catch {
      return []
    }
  })

  // Сохраняем состояние панели (это side-effect, не setState — допустимо)
  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEY_OPEN, String(isOpen))
  }, [isOpen])

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((v) => !v), [])

  const addToRecent = useCallback((entityId: string) => {
    setRecentIds((prev) => {
      const next = [entityId, ...prev.filter((id) => id !== entityId)].slice(0, MAX_RECENT)
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
