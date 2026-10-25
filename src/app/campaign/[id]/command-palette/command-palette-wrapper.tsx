'use client'

import { useCommandPalette } from '@/lib/hooks/use-command-palette'
import CommandPalette from './command-palette'
import { Search } from 'lucide-react'
import { Tooltip } from '@/components/ui'
import { useT } from '@/lib/i18n'
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
  const t = useT()
  const { isOpen, open, close } = useCommandPalette()

  return (
    <>
      <Tooltip content={t('commands.hint')}>
        <button
          onClick={open}
          className="flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-1.5 text-sm text-[var(--text-muted)] transition-colors hover:border-[var(--border-hover)] hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
          aria-label={t('commands.open')}
        >
          <Search size={14} />
          <span className="hidden sm:inline">{t('commands.searchPlaceholder')}</span>
          <kbd className="hidden items-center gap-0.5 rounded border border-[var(--border-default)] bg-[var(--bg-secondary)] px-1.5 py-0.5 text-[10px] md:inline-flex">
            <span>⌘</span>
            <span>K</span>
          </kbd>
        </button>
      </Tooltip>

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
