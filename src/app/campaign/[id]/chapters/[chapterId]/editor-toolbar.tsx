'use client'

import { Pencil, Eye, Columns, Bold, Italic, List, Link2, Quote, Code2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { IconButton, Tooltip } from '@/components/ui'
import { useT } from '@/lib/i18n'
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
  const t = useT()

  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-default)] pb-3">
      {!hideViewModes && (
        <div className="flex items-center gap-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-1">
          <ViewButton
            active={view === 'edit'}
            onClick={() => onViewChange('edit')}
            icon={<Pencil size={14} />}
            label={t('chapters.editor')}
          />
          <ViewButton
            active={view === 'split'}
            onClick={() => onViewChange('split')}
            icon={<Columns size={14} />}
            label={t('chapters.view.split')}
          />
          <ViewButton
            active={view === 'preview'}
            onClick={() => onViewChange('preview')}
            icon={<Eye size={14} />}
            label={t('chapters.preview')}
          />
        </div>
      )}

      {!readOnly && view !== 'preview' && onInsert && (
        <div className="flex items-center gap-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-1">
          <Tooltip content={t('chapters.toolbar.boldHint')}>
            <ToolButton
              onClick={() => onInsert(`**${t('chapters.toolbar.boldSample')}**`, true)}
              icon={<Bold size={14} />}
            />
          </Tooltip>
          <Tooltip content={t('chapters.toolbar.italicHint')}>
            <ToolButton
              onClick={() => onInsert(`*${t('chapters.toolbar.italicSample')}*`, true)}
              icon={<Italic size={14} />}
            />
          </Tooltip>
          <Tooltip content={t('chapters.toolbar.listHint')}>
            <ToolButton
              onClick={() => onInsert(`\n- ${t('chapters.toolbar.listSample')}`)}
              icon={<List size={14} />}
            />
          </Tooltip>
          <Tooltip content={t('chapters.toolbar.linkHint')}>
            <ToolButton
              onClick={() => onInsert(`[${t('chapters.toolbar.linkTextSample')}](url)`)}
              icon={<Link2 size={14} />}
            />
          </Tooltip>
          <Tooltip content={t('chapters.toolbar.quoteHint')}>
            <ToolButton
              onClick={() => onInsert(`\n> ${t('chapters.toolbar.quoteSample')}\n`)}
              icon={<Quote size={14} />}
            />
          </Tooltip>
          <Tooltip content={t('chapters.toolbar.codeHint')}>
            <ToolButton
              onClick={() => onInsert(`\`${t('chapters.toolbar.codeSample')}\``, true)}
              icon={<Code2 size={14} />}
            />
          </Tooltip>
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
        'flex items-center gap-1.5 rounded px-2.5 py-1 text-xs transition-colors',
        active
          ? 'bg-[var(--accent)] text-white'
          : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
      )}
      title={label}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}

function ToolButton({ onClick, icon }: { onClick: () => void; icon: React.ReactNode }) {
  return (
    <IconButton variant="ghost" size="sm" label="" onClick={onClick}>
      {icon}
    </IconButton>
  )
}
