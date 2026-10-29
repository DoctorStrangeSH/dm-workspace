'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { ArrowDown, Dices, Trash2 } from 'lucide-react'
import { Button, Dialog } from '@/components/ui'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import type { MessageWithAuthor } from '@/lib/types'

interface Props {
  messages: MessageWithAuthor[]
  currentUserId: string
  isDm: boolean
  onDelete?: (messageId: string) => void
  active?: boolean
}

export default function MessageList({
  messages,
  currentUserId,
  isDm,
  onDelete,
  active = true,
}: Props) {
  const { t, lang } = useI18n()
  const locale = lang === 'ru' ? 'ru-RU' : 'en-US'
  const scrollRef = useRef<HTMLDivElement>(null)
  const atBottom = useRef(true)
  const lastSeen = useRef<string | undefined>(undefined)
  const [hasNew, setHasNew] = useState(false)
  const [awayFromBottom, setAwayFromBottom] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const latest = messages.at(-1)
  useLayoutEffect(() => {
    if (!active) return
    // A native dialog is shown after commit; wait for its real scroll dimensions.
    const frame = requestAnimationFrame(() => {
      if (!scrollRef.current) return
      if (
        atBottom.current ||
        (latest?.user_id === currentUserId && latest?.id !== lastSeen.current)
      ) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        atBottom.current = true
        setAwayFromBottom(false)
        setHasNew(false)
      } else if (latest?.id !== lastSeen.current) setHasNew(true)
      lastSeen.current = latest?.id
    })
    return () => cancelAnimationFrame(frame)
  }, [latest?.id, latest?.user_id, currentUserId, active])

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
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div
          ref={scrollRef}
          role="log"
          aria-label={t('chat.title')}
          aria-live="polite"
          aria-relevant="additions text"
          onScroll={(event) => {
            const element = event.currentTarget
            const near = element.scrollHeight - element.scrollTop - element.clientHeight < 96
            atBottom.current = near
            setAwayFromBottom(!near)
            if (near) setHasNew(false)
          }}
          className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4"
        >
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
                <div className="flex min-h-8 items-center gap-2 text-xs">
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
                      aria-label={t('chat.deleteMessage')}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition hover:bg-[var(--danger-subtle)] hover:text-[var(--danger-text)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100"
                    >
                      <Trash2 size={13} aria-hidden="true" />
                    </button>
                  )}
                </div>

                {isRoll && roll ? (
                  <div
                    className={cn(
                      'max-w-[90%] rounded-2xl border px-4 py-3',
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
                      'max-w-[90%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words whitespace-pre-wrap',
                      isOwn
                        ? 'border border-[var(--accent)]/20 bg-[var(--accent-subtle)] text-[var(--text-primary)]'
                        : 'bg-[var(--bg-secondary)] text-[var(--text-primary)]'
                    )}
                  >
                    {msg.content}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        {awayFromBottom && (
          <button
            type="button"
            onClick={() => {
              if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
              atBottom.current = true
              setHasNew(false)
              setAwayFromBottom(false)
            }}
            className="absolute bottom-3 left-1/2 flex min-h-11 -translate-x-1/2 items-center gap-2 rounded-full border border-[var(--border-hover)] bg-[var(--bg-elevated)] px-4 text-xs font-semibold whitespace-nowrap text-[var(--accent-text)] shadow-lg focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
          >
            <ArrowDown size={14} aria-hidden="true" />
            {hasNew ? t('chat.newMessages') : t('chat.jumpToLatest')}
          </button>
        )}
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
