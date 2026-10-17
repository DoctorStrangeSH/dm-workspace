'use client'

import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '@/lib/hooks/use-theme'
import { cn } from '@/lib/utils'
import type { ThemeMode } from '@/lib/types'

interface Props {
  variant?: 'compact' | 'full'
}

const THEMES: Array<{ value: ThemeMode; icon: typeof Sun; label: string }> = [
  { value: 'light', icon: Sun, label: 'Светлая' },
  { value: 'dark', icon: Moon, label: 'Тёмная' },
  { value: 'system', icon: Monitor, label: 'Системная' },
]

export default function ThemeToggle({ variant = 'compact' }: Props) {
  const { theme, setTheme } = useTheme()

  if (variant === 'compact') {
    // Кнопка-переключатель циклом: light → dark → system
    const currentIndex = THEMES.findIndex((t) => t.value === theme)
    const nextIndex = (currentIndex + 1) % THEMES.length
    const next = THEMES[nextIndex]
    const Current = THEMES[currentIndex]?.icon ?? Moon

    return (
      <button
        onClick={() => setTheme(next.value)}
        className="p-2 hover:bg-slate-800 rounded-lg transition"
        title={`Тема: ${THEMES[currentIndex]?.label} → ${next.label}`}
      >
        <Current size={16} />
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
      {THEMES.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 text-xs rounded transition',
            theme === value
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          )}
          title={label}
        >
          <Icon size={12} />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  )
}