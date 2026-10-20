'use client'

import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '@/lib/hooks/use-theme'
import { cn } from '@/lib/utils'
import { IconButton } from '@/components/ui'
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
    const currentIndex = THEMES.findIndex((t) => t.value === theme)
    const nextIndex = (currentIndex + 1) % THEMES.length
    const next = THEMES[nextIndex]
    const Current = THEMES[currentIndex]?.icon ?? Moon

    // CHANGES: IconButton вместо <button> с хардкодными классами
    return (
      <IconButton
        variant="ghost"
        size="md"
        label={`Тема: ${THEMES[currentIndex]?.label} → ${next.label}`}
        onClick={() => setTheme(next.value)}
      >
        <Current size={16} />
      </IconButton>
    )
  }

  return (
    <div className="flex items-center gap-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-1">
      {THEMES.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={cn(
            'flex items-center gap-1.5 rounded px-2.5 py-1 text-xs transition-colors',
            theme === value
              ? 'bg-[var(--accent)] text-white'
              : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
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
