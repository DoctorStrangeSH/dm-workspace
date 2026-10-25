'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useLang, LANG_COOKIE } from '@/lib/i18n'
import type { Lang } from '@/lib/i18n'
import { cn } from '@/lib/utils'

interface Props {
  className?: string
}

/**
 * Переключатель языка UI (RU/EN).
 * CHANGES:
 * 1. Пишет cookie dm-lang (переживает навигацию).
 * 2. Мгновенно обновляет <html lang> — без ожидания refresh.
 * 3. router.refresh() — перерендер Server Components и I18nProvider.
 */
export function LangToggle({ className }: Props) {
  const router = useRouter()
  const current = useLang()
  const [isPending, startTransition] = useTransition()

  const setLang = (lang: Lang) => {
    if (lang === current) return
    document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`
    document.documentElement.setAttribute('lang', lang)
    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-1',
        isPending && 'opacity-60',
        className
      )}
      role="group"
      aria-label="Language"
    >
      <button
        type="button"
        onClick={() => setLang('ru')}
        disabled={isPending}
        aria-pressed={current === 'ru'}
        className={cn(
          'rounded px-2.5 py-1 text-xs font-medium transition-colors',
          current === 'ru'
            ? 'bg-[var(--accent)] text-white'
            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
        )}
      >
        RU
      </button>
      <button
        type="button"
        onClick={() => setLang('en')}
        disabled={isPending}
        aria-pressed={current === 'en'}
        className={cn(
          'rounded px-2.5 py-1 text-xs font-medium transition-colors',
          current === 'en'
            ? 'bg-[var(--accent)] text-white'
            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
        )}
      >
        EN
      </button>
    </div>
  )
}
