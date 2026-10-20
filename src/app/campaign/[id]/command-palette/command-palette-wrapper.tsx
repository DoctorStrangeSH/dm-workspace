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
        className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-sm text-slate-400 transition hover:border-slate-700 hover:text-white"
        title="Палитра команд (Ctrl+K)"
      >
        <Search size={14} />
        <span className="hidden sm:inline">Поиск...</span>
        <kbd className="hidden items-center gap-0.5 rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[10px] md:inline-flex">
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
