'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { sendMessage, deleteMessage } from '@/lib/actions/messages'
import { useToast } from '@/components/toast/toast-provider'
import MessageList from './message-list'
import MessageInput from './message-input'
import DiceRoller from './dice-roller'
import { rollChatDice, type D20Mode } from '@/lib/dnd/chat-dice'
import { useT } from '@/lib/i18n'
import type { MessageWithAuthor } from '@/lib/types'
import { useRealtimeMessages } from '@/lib/hooks/use-realtime-messages'
import { useDmScreenContext } from '../dm-screen/dm-screen-context'
import { WorkspacePanel } from '../workspace-panel'

interface Props {
  campaignId: string
  initialMessages: MessageWithAuthor[]
  currentUserId: string
  isDm: boolean
}

export default function ChatPanel({ campaignId, initialMessages, currentUserId, isDm }: Props) {
  const t = useT()
  const { isChatOpen, close } = useDmScreenContext()
  const pathname = usePathname()
  const inSession = pathname.startsWith(`/campaign/${campaignId}/session`)
  const messages = useRealtimeMessages({ campaignId, initialMessages, enabled: !inSession })
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
      const res = await deleteMessage(messageId, campaignId)
      if ('error' in res) toast.error(res.error ?? t('common.error'))
      else router.refresh()
    })
  }

  // Session mode already contains its own chat; do not mount a competing drawer.
  if (inSession) return null
  return (
    <WorkspacePanel
      id="campaign-chat"
      open={isChatOpen}
      onClose={close}
      title={t('chat.title')}
      description={t('workspace.chatDescription')}
      isDm={isDm}
    >
      <MessageList
        messages={messages}
        currentUserId={currentUserId}
        isDm={isDm}
        onDelete={handleDelete}
        active={isChatOpen}
      />
      <DiceRoller onRoll={handleRoll} disabled={isPending} error={rollError} />
      <MessageInput onSend={handleSendText} disabled={isPending} />
    </WorkspacePanel>
  )
}
