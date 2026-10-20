'use client'

import { CheckSquare, Square, X, CheckCheck } from 'lucide-react'

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
      <button
        onClick={onToggleMode}
        className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-white"
        title="Режим выделения"
      >
        <CheckSquare size={14} />
        Выбрать
      </button>
    )
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-indigo-900/50 bg-indigo-950/40 px-3 py-2">
      <button
        onClick={onToggleAll}
        className="flex items-center gap-2 text-sm text-slate-300 transition hover:text-white"
        title={allSelected ? 'Снять выделение' : 'Выделить все'}
      >
        {allSelected ? <CheckCheck size={16} className="text-indigo-400" /> : <Square size={16} />}
        {allSelected ? 'Снять все' : 'Выделить все'}
      </button>

      <div className="text-sm text-slate-400">
        Выбрано:{' '}
        <span className="font-medium text-white">
          {selectedCount} из {totalCount}
        </span>
      </div>

      <button
        onClick={onToggleMode}
        className="ml-auto flex items-center gap-1.5 rounded px-2.5 py-1 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-white"
      >
        <X size={14} />
        Отмена
      </button>
    </div>
  )
}
