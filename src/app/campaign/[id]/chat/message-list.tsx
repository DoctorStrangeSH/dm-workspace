'use client'

import { useEffect, useRef, useState } from 'react'
import { Dices } from 'lucide-react'
import { Button, Dialog } from '@/components/ui'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import type { MessageWithAuthor } from '@/lib/types'

interface Props {
  messages: MessageWithAuthor[]
  currentUserId: string
  isDm: boolean
  onDelete?: (messageId: string) => void
}

export default function MessageList({ messages, currentUserId, isDm, onDelete }: Props) {
  const { t, lang } = useI18n()
  const locale = lang === 'ru' ? 'ru-RU' : 'en-US'
  const bottomRef = useRef<HTMLDivElement>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
    })

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center">
        <div>
          <Dices size={32} className="mx-auto mb-2 text-[var(--text-subtle)]" />
          <p className="text-sm text-[var(--text-muted)]">{t('chat.empty.title')}</p>
          <p className="mt-1 text-xs text-[var(--text-subtle)]">{t('chat.empty.description')}</p>
        </div>
      </div>
    )
  }

  const handleDeleteConfirm = () => {
    if (deleteTarget && onDelete) {
      onDelete(deleteTarget)
      setDeleteTarget(null)
    }
  }

  return (
    <>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {messages.map((msg) => {
          const isOwn = msg.user_id === currentUserId
          const isRoll = msg.type === 'roll'
          const isSystem = msg.type === 'system'
          const roll = msg.metadata?.roll

          const canDelete = isOwn || isDm

          if (isSystem) {
            return (
              <div
                key={msg.id}
                className="py-1 text-center text-xs text-[var(--text-muted)] italic"
              >
                {msg.content}
              </div>
            )
          }

          return (
            <div key={msg.id} className={cn('group flex flex-col gap-0.5', isOwn && 'items-end')}>
              <div className="flex items-center gap-2 text-xs">
                <span
                  className={cn(
                    'font-medium',
                    isOwn ? 'text-[var(--accent-text)]' : 'text-[var(--text-secondary)]'
                  )}
                >
                  {msg.author?.display_name ?? msg.author?.username ?? '???'}
                </span>
                <span className="text-[var(--text-subtle)]">{formatTime(msg.created_at)}</span>
                {canDelete && onDelete && (
                  <button
                    onClick={() => setDeleteTarget(msg.id)}
                    className="text-[10px] text-[var(--danger)] opacity-0 transition group-hover:opacity-100 hover:text-[var(--danger-text)]"
                  >
                    ×
                  </button>
                )}
              </div>

              {isRoll && roll ? (
                <div
                  className={cn(
                    'max-w-[280px] rounded-lg border px-3 py-2',
                    isOwn
                      ? 'border-[var(--accent)]/40 bg-[var(--accent-subtle)]'
                      : 'border-[var(--border-default)] bg-[var(--bg-app)]'
                  )}
                >
                  {roll.label && (
                    <div className="mb-1 text-xs text-[var(--text-muted)]">{roll.label}</div>
                  )}
                  <div className="flex items-center gap-2">
                    <Dices size={14} className="shrink-0 text-[var(--accent-text)]" />
                    <span className="text-lg font-bold text-[var(--accent-text)]">
                      {roll.total}
                    </span>
                    <span className="font-mono text-xs text-[var(--text-muted)]">
                      [{roll.rolls.join(', ')}]
                      {roll.modifier !== 0 && (
                        <>
                          {' '}
                          {roll.modifier > 0 ? '+' : ''}
                          {roll.modifier}
                        </>
                      )}
                    </span>
                  </div>
                  <div className="mt-0.5 font-mono text-[10px] text-[var(--text-subtle)]">
                    {roll.expression}
                  </div>
                </div>
              ) : (
                <div
                  className={cn(
                    'max-w-[280px] rounded-lg px-3 py-1.5 text-sm break-words whitespace-pre-wrap',
                    isOwn
                      ? 'bg-[var(--accent)] text-white'
                      : 'bg-[var(--bg-secondary)] text-[var(--text-primary)]'
                  )}
                >
                  {msg.content}
                </div>
              )}
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* CHANGES: confirm() → Dialog */}
      <Dialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={t('chat.deleteConfirm.title')}
        description={t('chat.deleteConfirm.description')}
        size="sm"
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setDeleteTarget(null)}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" size="md" onClick={handleDeleteConfirm}>
              {t('common.delete')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-[var(--text-muted)]">{t('chat.deleteConfirm.cannotUndo')}</p>
      </Dialog>
    </>
  )
}
