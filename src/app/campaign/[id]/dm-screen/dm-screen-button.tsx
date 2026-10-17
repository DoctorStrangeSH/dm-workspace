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
        'fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full shadow-2xl transition',
        'bg-indigo-600 hover:bg-indigo-500 text-white font-medium',
        'border border-indigo-400/30',
        'px-3 py-3 sm:px-4',
        isOpen && 'opacity-0 pointer-events-none'
      )}
      title="Панель ГМа (Ctrl+M)"
      aria-label="Открыть панель ГМа"
    >
      <BookMarked size={18} />
      <span className="hidden sm:inline">DM Screen</span>
      <kbd className="hidden md:inline ml-1 px-1.5 py-0.5 text-xs bg-indigo-800/60 border border-indigo-700/50 rounded">
        ⌘M
      </kbd>
    </button>
  )
}