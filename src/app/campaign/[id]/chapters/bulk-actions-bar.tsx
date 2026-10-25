'use client'

import { useState, useTransition } from 'react'
import { Trash2, Eye, EyeOff, Download, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n'

interface Props {
  selectedCount: number
  onDelete: () => void
  onSetVisible: (visible: boolean) => Promise<void>
  onExport: () => Promise<void>
}

export default function BulkActionsBar({ selectedCount, onDelete, onSetVisible, onExport }: Props) {
  const t = useT()
  const [isPending, startTransition] = useTransition()
  const [action, setAction] = useState<string | null>(null)

  const runSync = (name: string, fn: () => void) => {
    setAction(name)
    try {
      fn()
    } finally {
      setAction(null)
    }
  }

  const runAsync = (name: string, fn: () => Promise<void>) => {
    setAction(name)
    startTransition(async () => {
      try {
        await fn()
      } finally {
        setAction(null)
      }
    })
  }

  if (selectedCount === 0) return null

  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-40 -translate-x-1/2">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 py-3 shadow-[var(--shadow-xl)]">
        <span className="border-r border-[var(--border-default)] pr-2 text-sm text-[var(--text-muted)]">
          {t('chapters.bulk.selected')}:{' '}
          <span className="font-medium text-[var(--text-primary)]">{selectedCount}</span>
        </span>

        <ActionButton
          icon={<Eye size={16} />}
          label={t('chapters.show')}
          onClick={() => runAsync('show', () => onSetVisible(true))}
          disabled={isPending}
          loading={action === 'show'}
        />

        <ActionButton
          icon={<EyeOff size={16} />}
          label={t('chapters.hide')}
          onClick={() => runAsync('hide', () => onSetVisible(false))}
          disabled={isPending}
          loading={action === 'hide'}
        />

        <ActionButton
          icon={<Download size={16} />}
          label={t('chapters.bulk.export')}
          onClick={() => runAsync('export', onExport)}
          disabled={isPending}
          loading={action === 'export'}
        />

        <div className="h-6 w-px bg-[var(--border-default)]" />

        <ActionButton
          icon={<Trash2 size={16} />}
          label={t('common.delete')}
          variant="danger"
          onClick={() => runSync('delete', onDelete)}
          disabled={isPending}
          loading={action === 'delete'}
        />
      </div>
    </div>
  )
}

function ActionButton({
  icon,
  label,
  onClick,
  disabled,
  loading,
  variant = 'default',
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
  loading?: boolean
  variant?: 'default' | 'danger'
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition disabled:opacity-50',
        variant === 'danger'
          ? 'text-[var(--danger)] hover:bg-[var(--danger-subtle)]'
          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
      )}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}
