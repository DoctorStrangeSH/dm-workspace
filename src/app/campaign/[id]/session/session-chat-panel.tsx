'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquare } from 'lucide-react'
import { sendMessage } from '@/lib/actions/messages'
import { useToast } from '@/components/toast/toast-provider'
import { useRealtimeMessages } from '@/lib/hooks/use-realtime-messages'
import MessageList from '../chat/message-list'
import MessageInput from '../chat/message-input'
import DiceRoller from '../chat/dice-roller'
import { useT } from '@/lib/i18n'
import { rollDice, parseDice } from '@/lib/dnd/formulas'
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

  const handleSendText = async (content: string) => {
    const res = await sendMessage(campaignId, content, 'text')
    if ('error' in res) {
      toast.error(res.error ?? t('common.error'))
      return false
    }
    router.refresh()
    return true
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
      const res = await (
        await import('@/lib/actions/messages')
      ).deleteMessage(messageId, campaignId)
      if ('error' in res) toast.error(res.error ?? t('common.error'))
      else router.refresh()
    })
  }

  return (
    <aside id="campaign-session-chat" className="flex min-h-0 flex-col border-l border-[var(--border-default)] bg-[var(--bg-surface)]">
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

      <DiceRoller onRoll={handleRoll} disabled={isPending} />

      <MessageInput onSend={handleSendText} disabled={isPending} />
    </aside>
  )
}
