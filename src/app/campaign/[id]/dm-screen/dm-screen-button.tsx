'use client'

import { BookMarked } from 'lucide-react'
import { useDmScreenContext } from './dm-screen-context'
import { useT } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export default function DmScreenButton() {
  const t = useT()
  const { isOpen, toggle } = useDmScreenContext()

  return (
    <button
      onClick={toggle}
      className={cn(
        // CHANGES (задача 4):
        // - bottom-20 (не перекрывает мобильную навигацию, как ChatPanel)
        // - right-4 (не right-6, симметрично с ChatPanel)
        // - токены (не bg-indigo-600)
        // - z-40 (не 50 — Dialog/Dropdown выше)
        'fixed right-4 bottom-20 z-40 flex items-center gap-2 rounded-full px-3 py-2.5 shadow-2xl transition sm:right-6 sm:bottom-6 sm:px-4 sm:py-3',
        'bg-[var(--accent)] font-medium text-white hover:bg-[var(--accent-hover)]',
        'border border-[var(--accent)]/30',
        isOpen && 'pointer-events-none opacity-0'
      )}
      title={t('dmScreen.openHint')}
      aria-label={t('dmScreen.open')}
    >
      <BookMarked size={18} />
      <span className="hidden sm:inline">{t('dmScreen.button')}</span>
      <kbd className="ml-1 hidden rounded border border-white/30 bg-white/10 px-1.5 py-0.5 text-xs md:inline">
        ⌘M
      </kbd>
    </button>
  )
}
