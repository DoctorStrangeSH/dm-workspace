'use client'

import { useTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { sendMessage, deleteMessage } from '@/lib/actions/messages'
import { useToast } from '@/components/toast/toast-provider'
import MessageList from './message-list'
import MessageInput from './message-input'
import DiceRoller from './dice-roller'
import { rollDice, parseDice } from '@/lib/dnd/formulas'
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
      const res = await sendMessage(campaignId, `${expr} = ${result.total}`, 'roll', {
        roll: { expression: expr, rolls: result.rolls, total: result.total, modifier },
      })
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
      <DiceRoller onRoll={handleRoll} disabled={isPending} />
      <MessageInput onSend={handleSendText} disabled={isPending} />
    </WorkspacePanel>
  )
}
