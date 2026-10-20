'use client'

import { CheckSquare, Square, X, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui'

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
  if (!isSelectionMode) {
    return (
      <Button
        variant="secondary"
        size="md"
        icon={<CheckSquare size={14} />}
        onClick={onToggleMode}
        title="Режим выделения"
      >
        Выбрать
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-[var(--accent)]/30 bg-[var(--accent-subtle)] px-3 py-2">
      <button
        onClick={onToggleAll}
        className="flex items-center gap-2 text-sm text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
        title={allSelected ? 'Снять выделение' : 'Выделить все'}
      >
        {allSelected ? (
          <CheckCheck size={16} className="text-[var(--accent-text)]" />
        ) : (
          <Square size={16} />
        )}
        {allSelected ? 'Снять все' : 'Выделить все'}
      </button>

      <div className="text-sm text-[var(--text-muted)]">
        Выбрано:{' '}
        <span className="font-medium text-[var(--text-primary)]">
          {selectedCount} из {totalCount}
        </span>
      </div>

      <Button
        variant="ghost"
        size="sm"
        icon={<X size={14} />}
        onClick={onToggleMode}
        className="ml-auto"
      >
        Отмена
      </Button>
    </div>
  )
}
