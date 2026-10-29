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
        <div
          role="group"
          aria-label={t('chapters.toolbar.viewMode')}
          className="flex flex-wrap items-center gap-1 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-1"
        >
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
        <div
          role="group"
          aria-label={t('chapters.toolbar.formatting')}
          className="flex max-w-full flex-wrap items-center gap-1 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-1"
        >
          {[
            {
              icon: Bold,
              key: 'bold',
              snippet: `**${t('chapters.toolbar.boldSample')}**`,
              wrap: true,
            },
            {
              icon: Italic,
              key: 'italic',
              snippet: `*${t('chapters.toolbar.italicSample')}*`,
              wrap: true,
            },
            { icon: List, key: 'list', snippet: `\n- ${t('chapters.toolbar.listSample')}` },
            { icon: Link2, key: 'link', snippet: `[${t('chapters.toolbar.linkTextSample')}](url)` },
            { icon: Quote, key: 'quote', snippet: `\n> ${t('chapters.toolbar.quoteSample')}\n` },
            {
              icon: Code2,
              key: 'code',
              snippet: `\`${t('chapters.toolbar.codeSample')}\``,
              wrap: true,
            },
          ].map(({ icon: Icon, key, snippet, wrap }) => (
            <Tooltip key={key} content={t(`chapters.toolbar.${key}Hint`)}>
              <IconButton
                variant="ghost"
                size="md"
                className="h-11 w-11 rounded-lg"
                label={t(`chapters.toolbar.${key}Hint`)}
                onClick={() => onInsert(snippet, wrap)}
              >
                <Icon size={17} aria-hidden="true" />
              </IconButton>
            </Tooltip>
          ))}
        </div>
      )}

      <div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-2">
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
        'flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]',
        active
          ? 'bg-[var(--accent)] text-[var(--accent-foreground)]'
          : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
      )}
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={label}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}
