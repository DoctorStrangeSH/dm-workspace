'use client'

import { CheckSquare, Square, X, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui'
import { useT } from '@/lib/i18n'

interface Props {
  totalCount: number
  selectedCount: number
  allSelected: boolean
  onToggleMode: () => void
  onToggleAll: () => void
  isSelectionMode: boolean
}

export default function SelectionBar({
  totalCount,
  selectedCount,
  allSelected,
  onToggleMode,
  onToggleAll,
  isSelectionMode,
}: Props) {
  const t = useT()

  if (!isSelectionMode) {
    return (
      <Button
        variant="secondary"
        size="md"
        icon={<CheckSquare size={14} />}
        onClick={onToggleMode}
        title={t('chapters.selection.mode')}
      >
        {t('chapters.selection.select')}
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-[var(--accent)]/30 bg-[var(--accent-subtle)] px-3 py-2">
      <button
        onClick={onToggleAll}
        className="flex items-center gap-2 text-sm text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
        title={
          allSelected ? t('chapters.selection.unselectAll') : t('chapters.selection.selectAll')
        }
      >
        {allSelected ? (
          <CheckCheck size={16} className="text-[var(--accent-text)]" />
        ) : (
          <Square size={16} />
        )}
        {allSelected ? t('chapters.selection.unselectAll') : t('chapters.selection.selectAll')}
      </button>

      <div className="text-sm text-[var(--text-muted)]">
        {t('chapters.selection.selected')}:{' '}
        <span className="font-medium text-[var(--text-primary)]">
          {t('chapters.selection.ofCount', { selected: selectedCount, total: totalCount })}
        </span>
      </div>

      <Button
        variant="ghost"
        size="sm"
        icon={<X size={14} />}
        onClick={onToggleMode}
        className="ml-auto"
      >
        {t('common.cancel')}
      </Button>
    </div>
  )
}
