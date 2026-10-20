'use client'

import { Pencil, Eye, Columns, Bold, Italic, List, Link2, Quote, Code2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import SaveStatus from './save-status'

export type ViewMode = 'edit' | 'split' | 'preview'

interface Props {
  view: ViewMode
  onViewChange: (v: ViewMode) => void
  status: 'idle' | 'saving' | 'saved' | 'error'
  lastSaved: Date | null
  error: string | null
  readOnly: boolean
  onInsert?: (snippet: string, wrap?: boolean) => void
  exportButton?: React.ReactNode
  hideViewModes?: boolean
}

export default function EditorToolbar({
  view,
  onViewChange,
  status,
  lastSaved,
  error,
  readOnly,
  onInsert,
  exportButton,
  hideViewModes = false,
}: Props) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
      {/* Режимы — скрываем на мобиле */}
      {!hideViewModes && (
        <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 p-1">
          <ViewButton
            active={view === 'edit'}
            onClick={() => onViewChange('edit')}
            icon={<Pencil size={14} />}
            label="Редактор"
          />
          <ViewButton
            active={view === 'split'}
            onClick={() => onViewChange('split')}
            icon={<Columns size={14} />}
            label="Разделённый"
          />
          <ViewButton
            active={view === 'preview'}
            onClick={() => onViewChange('preview')}
            icon={<Eye size={14} />}
            label="Просмотр"
          />
        </div>
      )}

      {/* Быстрые вставки (только для ГМа) */}
      {!readOnly && view !== 'preview' && onInsert && (
        <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 p-1">
          <ToolButton
            onClick={() => onInsert('**жирный**', true)}
            icon={<Bold size={14} />}
            title="Жирный (Ctrl+B)"
          />
          <ToolButton
            onClick={() => onInsert('*курсив*', true)}
            icon={<Italic size={14} />}
            title="Курсив (Ctrl+I)"
          />
          <ToolButton
            onClick={() => onInsert('\n- элемент списка')}
            icon={<List size={14} />}
            title="Список"
          />
          <ToolButton
            onClick={() => onInsert('[текст](url)')}
            icon={<Link2 size={14} />}
            title="Ссылка"
          />
          <ToolButton
            onClick={() => onInsert('\n> цитата\n')}
            icon={<Quote size={14} />}
            title="Цитата"
          />
          <ToolButton
            onClick={() => onInsert('`код`', true)}
            icon={<Code2 size={14} />}
            title="Код"
          />
        </div>
      )}

      <div className="ml-auto flex items-center gap-2">
        {exportButton}
        {!readOnly && <SaveStatus status={status} lastSaved={lastSaved} error={error} />}
      </div>
    </div>
  )
}

function ViewButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 rounded px-2.5 py-1 text-xs transition',
        active ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      )}
      title={label}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}

function ToolButton({
  onClick,
  icon,
  title,
}: {
  onClick: () => void
  icon: React.ReactNode
  title: string
}) {
  return (
    <button
      onClick={onClick}
      className="rounded p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
      title={title}
      type="button"
    >
      {icon}
    </button>
  )
}
