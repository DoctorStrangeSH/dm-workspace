'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useSyncExternalStore,
} from 'react'
import { setTheme as saveTheme } from '@/lib/actions/settings'
import type { ThemeMode } from '@/lib/types'

interface ThemeContextValue {
  theme: ThemeMode
  resolvedTheme: 'dark' | 'light'
  setTheme: (theme: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const STORAGE_KEY = 'dm-workspace-theme'

interface Props {
  children: React.ReactNode
  initialTheme?: ThemeMode
}

// CHANGES:
// 1. Убран `useEffect(() => { setMounted(true); setThemeState(stored) }, [])` — каскадный рендер.
// 2. `theme` инициализируется lazy initializer'ом: читаем localStorage прямо в useState(() => ...).
//    На SSR (typeof window === 'undefined') возвращаем initialTheme, на клиенте — из localStorage.
//    Это официальный паттерн React для «initial state from external source».
// 3. `systemTheme` читается через useSyncExternalStore — правильный способ подписаться
//    на внешний источник (matchMedia), без setState в useEffect.
// 4. Убран `mounted` — он был нужен только чтобы избежать hydration mismatch,
//    но lazy initializer + suppressHydrationWarning на <html> решают это чище.
export function ThemeProvider({ children, initialTheme = 'dark' }: Props) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return initialTheme
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null
      return stored ?? initialTheme
    } catch {
      return initialTheme
    }
  })

  // useSyncExternalStore: подписка на matchMedia без setState в useEffect
  const systemTheme = useSyncExternalStore<'dark' | 'light'>(
    (onChange) => {
      if (typeof window === 'undefined') return () => {}
      const media = window.matchMedia('(prefers-color-scheme: dark)')
      media.addEventListener('change', onChange)
      return () => media.removeEventListener('change', onChange)
    },
    () => {
      if (typeof window === 'undefined') return 'dark'
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    },
    () => 'dark' // SSR fallback
  )

  // Применяем тему к html
  const applyTheme = useCallback((resolved: 'dark' | 'light') => {
    if (typeof document === 'undefined') return
    document.documentElement.setAttribute('data-theme', resolved)
  }, [])

  // Применяем при смене (это НЕ setState, это side-effect на DOM — допустимо в useEffect)
  useEffect(() => {
    const resolved = theme === 'system' ? systemTheme : theme
    applyTheme(resolved)
  }, [theme, systemTheme, applyTheme])

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme)
    try {
      localStorage.setItem(STORAGE_KEY, newTheme)
    } catch {
      // ignore
    }
    saveTheme(newTheme).catch(() => {
      // ignore — не критично
    })
  }, [])

  const resolvedTheme: 'dark' | 'light' = theme === 'system' ? systemTheme : theme

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return ctx
}
