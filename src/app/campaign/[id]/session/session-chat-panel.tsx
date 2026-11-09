'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquare } from 'lucide-react'
import { sendMessage } from '@/lib/actions/messages'
import { useToast } from '@/components/toast/toast-provider'
import { useRealtimeMessages } from '@/lib/hooks/use-realtime-messages'
import MessageList from '../chat/message-list'
import MessageInput from '../chat/message-input'
import DiceRoller from '../chat/dice-roller'
import { useT } from '@/lib/i18n'
import { rollChatDice, type D20Mode } from '@/lib/dnd/chat-dice'
import type { MessageWithAuthor } from '@/lib/types'
import { useDmScreenContext } from '../dm-screen/dm-screen-context'

interface Props {
  campaignId: string
  initialMessages: MessageWithAuthor[]
  currentUserId: string | null
  isDm: boolean
}

export function SessionChatPanel({ campaignId, initialMessages, currentUserId, isDm }: Props) {
  const t = useT()
  const { isChatOpen } = useDmScreenContext()
  const messages = useRealtimeMessages({ campaignId, initialMessages })
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const rolling = useRef(false)
  const [rollError, setRollError] = useState<string | null>(null)

  const handleSendText = async (content: string) => {
    const res = await sendMessage(campaignId, content, 'text')
    if ('error' in res) {
      toast.error(res.error ?? t('common.error'))
      return false
    }
    router.refresh()
    return true
  }

  const handleRoll = (sides: number, count: number, modifier: number, mode: D20Mode = 'normal') => {
    if (isPending || rolling.current) return
    const result = rollChatDice(sides, count, modifier, mode)
    if (!result) return
    setRollError(null)
    rolling.current = true
    startTransition(async () => {
      try {
        const res = await sendMessage(
          campaignId,
          `${result.expression} = ${result.total}`,
          'roll',
          { roll: result }
        )
        if ('error' in res) setRollError(res.error ?? t('common.error'))
        else router.refresh()
      } catch {
        setRollError(t('chat.dice.uncertain'))
      } finally {
        rolling.current = false
      }
    })
  }

  const handleDelete = (messageId: string) => {
    startTransition(async () => {
      const res = await (
        await import('@/lib/actions/messages')
      ).deleteMessage(messageId, campaignId)
      if ('error' in res) toast.error(res.error ?? t('common.error'))
      else router.refresh()
    })
  }

  return (
    <aside
      id="campaign-session-chat"
      className="flex min-h-0 flex-col border-l border-[var(--border-default)] bg-[var(--bg-surface)]"
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-[var(--border-default)] px-3 py-2">
        <MessageSquare size={14} className="text-[var(--accent-text)]" />
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">{t('chat.title')}</h2>
      </div>

      <MessageList
        messages={messages}
        currentUserId={currentUserId ?? ''}
        isDm={isDm}
        onDelete={handleDelete}
        active={isChatOpen}
      />

      <DiceRoller onRoll={handleRoll} disabled={isPending} error={rollError} />

      <MessageInput onSend={handleSendText} disabled={isPending} />
    </aside>
  )
}
