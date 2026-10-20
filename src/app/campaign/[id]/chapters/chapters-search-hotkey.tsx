'use client'

import { useEffect } from 'react'

interface Props {
  onFocus: () => void
}

export default function ChaptersSearchHotkey({ onFocus }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyF' && !e.shiftKey && !e.altKey) {
        // Проверяем, что мы на странице глав
        const isOnChapters = window.location.pathname.endsWith('/chapters')
        if (!isOnChapters) return

        e.preventDefault()
        onFocus()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onFocus])

  return null
}
