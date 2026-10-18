'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquare, X, ChevronRight } from 'lucide-react'
import { sendMessage, deleteMessage } from '@/lib/actions/messages'
import { useToast } from '@/components/toast/toast-provider'
import MessageList from './message-list'
import MessageInput from './message-input'
import DiceRoller from './dice-roller'
import { rollDice, parseDice } from '@/lib/dnd/formulas'
import { cn } from '@/lib/utils'
import type { MessageWithAuthor } from '@/lib/types'
import { useRealtimeMessages } from '@/lib/hooks/use-realtime-messages'

interface Props {
  campaignId: string
  initialMessages: MessageWithAuthor[] 
  currentUserId: string
  isDm: boolean
}

export default function ChatPanel({
  campaignId,
  initialMessages,
  currentUserId,
  isDm,
}: Props) {
  const messages = useRealtimeMessages({
    campaignId,
    initialMessages,
    })
  const router = useRouter()
  const toast = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleSendText = (content: string, isHidden: boolean) => {
    startTransition(async () => {
      const res = await sendMessage(campaignId, content, 'text')
      if (res.error) toast.error(res.error)
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
      if (res.error) toast.error(res.error)
      else router.refresh()
    })
  }

  const handleDelete = (messageId: string) => {
    startTransition(async () => {
      const res = await deleteMessage(messageId, campaignId)
      if (res.error) toast.error(res.error)
      else router.refresh()
    })
  }

  return (
    <>
      {/* Кнопка открытия */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-6 left-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full shadow-2xl transition',
          'bg-violet-600 hover:bg-violet-500 text-white font-medium',
          'border border-violet-400/30',
          isOpen && 'opacity-0 pointer-events-none'
        )}
        title="Чат"
      >
        <MessageSquare size={18} />
        <span className="hidden sm:inline">Чат</span>
      </button>

      {/* Оверлей */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        />
      )}

      {/* Панель */}
      <aside
        className={cn(
          'fixed top-0 right-0 z-50 h-screen w-full sm:w-[380px] bg-slate-900 border-l border-slate-800 shadow-2xl transition-transform flex flex-col',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Заголовок */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquare size={18} className="text-violet-400" />
            <h2 className="font-semibold">Чат кампании</h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-slate-800 rounded-lg transition"
            title="Закрыть (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Список сообщений */}
        <MessageList
          messages={messages}
          currentUserId={currentUserId}
          isDm={isDm}
          onDelete={handleDelete}
        />

        {/* Кубики */}
        <DiceRoller onRoll={handleRoll} disabled={isPending} />

        {/* Поле ввода */}
        <MessageInput
          onSend={handleSendText}
          disabled={isPending}
          canHide={isDm}
        />
      </aside>
    </>
  )
}