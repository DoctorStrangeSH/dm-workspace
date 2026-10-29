'use client'

import { useState, useCallback } from 'react'

const STORAGE_KEY_RECENT = 'dm-screen-recent'

const MAX_RECENT = 8

export function useDmScreen() {
  const [activePanel, setActivePanel] = useState<'chat' | 'dm' | 'navigation' | null>(null)

  const [recentIds, setRecentIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const recent = localStorage.getItem(STORAGE_KEY_RECENT)
      const value: unknown = recent ? JSON.parse(recent) : []
      return Array.isArray(value)
        ? value.filter((id): id is string => typeof id === 'string').slice(0, MAX_RECENT)
        : []
    } catch {
      return []
    }
  })

  const open = useCallback(() => setActivePanel('dm'), [])
  const close = useCallback(() => setActivePanel(null), [])
  const toggle = useCallback(() => setActivePanel((v) => (v === 'dm' ? null : 'dm')), [])
  const openChat = useCallback(() => setActivePanel('chat'), [])
  const openNavigation = useCallback(() => setActivePanel('navigation'), [])
  const toggleChat = useCallback(() => setActivePanel((v) => (v === 'chat' ? null : 'chat')), [])

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
    activePanel,
    isOpen: activePanel === 'dm',
    isChatOpen: activePanel === 'chat',
    openChat,
    openNavigation,
    isNavigationOpen: activePanel === 'navigation',
    toggleChat,
    recentIds,
    open,
    close,
    toggle,
    addToRecent,
  }
}
