'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquare, X } from 'lucide-react'
import { sendMessage, deleteMessage } from '@/lib/actions/messages'
import { useToast } from '@/components/toast/toast-provider'
import MessageList from './message-list'
import MessageInput from './message-input'
import DiceRoller from './dice-roller'
import { rollDice, parseDice } from '@/lib/dnd/formulas'
import { useT } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import type { MessageWithAuthor } from '@/lib/types'
import { useRealtimeMessages } from '@/lib/hooks/use-realtime-messages'

interface Props {
  campaignId: string
  initialMessages: MessageWithAuthor[]
  currentUserId: string
  isDm: boolean
}

export default function ChatPanel({ campaignId, initialMessages, currentUserId, isDm }: Props) {
  const t = useT()
  const messages = useRealtimeMessages({ campaignId, initialMessages })
  const router = useRouter()
  const toast = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleSendText = (content: string) => {
    startTransition(async () => {
      const res = await sendMessage(campaignId, content, 'text')
      if ('error' in res) toast.error(res.error ?? t('common.error'))
      else router.refresh()
    })
  }

  const handleRoll = (sides: number, count: number, modifier: number) => {
    const expr = `${count}d${sides}${modifier >= 0 ? '+' : ''}${modifier}`
    const parsed = parseDice(expr)
    if (!parsed) return
    const result = rollDice(parsed)

    startTransition(async () => {
      const res = await sendMessage(
        campaignId,
        `${count}d${sides}${modifier !== 0 ? (modifier > 0 ? `+${modifier}` : modifier) : ''} = ${result.total}`,
        'roll',
        {
          roll: {
            expression: expr,
            rolls: result.rolls,
            total: result.total,
            modifier,
          },
        }
      )
      if ('error' in res) toast.error(res.error ?? t('common.error'))
      else router.refresh()
    })
  }

  const handleDelete = (messageId: string) => {
    startTransition(async () => {
      const res = await deleteMessage(messageId, campaignId)
      if ('error' in res) toast.error(res.error ?? t('common.error'))
      else router.refresh()
    })
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          // CHANGES (задача 5): bottom-20 (не перекрывает мобильную навигацию),
          // right-4 (не left-6 — не перекрывает мобильную навигацию),
          // z-40 (не перекрывает Dialog / Dropdown — у них z-50).
          'fixed right-4 bottom-20 z-40 flex items-center gap-2 rounded-full px-3 py-2.5 shadow-2xl transition sm:bottom-6 sm:px-4 sm:py-3',
          'bg-[var(--accent)] font-medium text-white hover:bg-[var(--accent-hover)]',
          'border border-[var(--accent)]/30',
          isOpen && 'pointer-events-none opacity-0'
        )}
        title={t('chat.open')}
      >
        <MessageSquare size={18} />
        <span className="hidden sm:inline">{t('chat.button')}</span>
      </button>

      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        />
      )}

      <aside
        className={cn(
          // CHANGES: z-40 (не 50), w-[320px] на мобилке (не w-full).
          'fixed top-0 right-0 z-40 flex h-screen w-[320px] flex-col border-l border-[var(--border-default)] bg-[var(--bg-surface)] shadow-2xl transition-transform sm:w-[380px]',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--border-default)] px-4 py-3">
          <div className="flex items-center gap-2">
            <MessageSquare size={18} className="text-[var(--accent-text)]" />
            <h2 className="font-semibold text-[var(--text-primary)]">{t('chat.title')}</h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-1.5 transition hover:bg-[var(--bg-hover)]"
            title={t('chat.closeHint')}
          >
            <X size={18} />
          </button>
        </div>

        <MessageList
          messages={messages}
          currentUserId={currentUserId}
          isDm={isDm}
          onDelete={handleDelete}
        />

        <DiceRoller onRoll={handleRoll} disabled={isPending} />

        <MessageInput onSend={handleSendText} disabled={isPending} canHide={isDm} />
      </aside>
    </>
  )
}
