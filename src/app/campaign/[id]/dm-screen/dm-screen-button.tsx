'use client'

import { BookMarked } from 'lucide-react'
import { useDmScreenContext } from './dm-screen-context'
import { cn } from '@/lib/utils'

export default function DmScreenButton() {
  const { isOpen, toggle } = useDmScreenContext()

  return (
    <button
      onClick={toggle}
      className={cn(
        'fixed right-6 bottom-6 z-40 flex items-center gap-2 rounded-full shadow-2xl transition',
        'bg-indigo-600 font-medium text-white hover:bg-indigo-500',
        'border border-indigo-400/30',
        'px-3 py-3 sm:px-4',
        isOpen && 'pointer-events-none opacity-0'
      )}
      title="Панель ГМа (Ctrl+M)"
      aria-label="Открыть панель ГМа"
    >
      <BookMarked size={18} />
      <span className="hidden sm:inline">DM Screen</span>
      <kbd className="ml-1 hidden rounded border border-indigo-700/50 bg-indigo-800/60 px-1.5 py-0.5 text-xs md:inline">
        ⌘M
      </kbd>
    </button>
  )
}
