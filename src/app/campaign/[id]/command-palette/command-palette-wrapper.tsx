'use client'

import { useCommandPalette } from '@/lib/hooks/use-command-palette'
import CommandPalette from './command-palette'
import { Search } from 'lucide-react'
import type { Entity, Chapter } from '@/lib/types'

interface Props {
  campaignId: string
  campaignName: string
  chapters: Chapter[]
  entities: Entity[]
}

export default function CommandPaletteWrapper({
  campaignId,
  campaignName,
  chapters,
  entities,
}: Props) {
  const { isOpen, open, close } = useCommandPalette()

  return (
    <>
      <button
        onClick={open}
        className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg text-sm text-slate-400 hover:text-white transition"
        title="Палитра команд (Ctrl+K)"
      >
        <Search size={14} />
        <span className="hidden sm:inline">Поиск...</span>
        <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] bg-slate-800 border border-slate-700 rounded">
          <span>⌘</span>
          <span>K</span>
        </kbd>
      </button>

      <CommandPalette
        isOpen={isOpen}
        onClose={close}
        campaignId={campaignId}
        campaignName={campaignName}
        chapters={chapters}
        entities={entities}
      />
    </>
  )
}