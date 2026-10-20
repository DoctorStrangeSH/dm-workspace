'use client'

import { useSyncExternalStore } from 'react'

/**
 * CHANGES: заменён useState + useEffect на useSyncExternalStore.
 * Это стандартный хук React для подписки на внешние источники (matchMedia),
 * без setState в useEffect и без каскадных рендеров.
 * SSR-safe: на сервере возвращает false.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = (onChange: () => void) => {
    if (typeof window === 'undefined') return () => {}
    const media = window.matchMedia(query)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }

  const getSnapshot = () => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  }

  const getServerSnapshot = () => false

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)')
}

export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 768px) and (max-width: 1023px)')
}

export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)')
}