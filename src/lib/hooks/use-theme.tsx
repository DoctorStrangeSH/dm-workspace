'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
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

export function ThemeProvider({ children, initialTheme = 'dark' }: Props) {
  const [theme, setThemeState] = useState<ThemeMode>(initialTheme)
  const [systemTheme, setSystemTheme] = useState<'dark' | 'light'>('dark')
  const [mounted, setMounted] = useState(false)

  // Применяем тему к html
  const applyTheme = useCallback((resolved: 'dark' | 'light') => {
    if (typeof document === 'undefined') return
    document.documentElement.setAttribute('data-theme', resolved)
  }, [])

  // При монтировании читаем из localStorage
  useEffect(() => {
    setMounted(true)
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null
      if (stored) setThemeState(stored)
    } catch {
      // ignore
    }
  }, [])

  // Детект системной темы
  useEffect(() => {
    if (typeof window === 'undefined') return

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    setSystemTheme(media.matches ? 'dark' : 'light')

    const listener = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light')
    }
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [])

  // Применяем при смене
  useEffect(() => {
    if (!mounted) return
    const resolved = theme === 'system' ? systemTheme : theme
    applyTheme(resolved)
  }, [theme, systemTheme, applyTheme, mounted])

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

  const resolvedTheme: 'dark' | 'light' =
    theme === 'system' ? systemTheme : theme

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