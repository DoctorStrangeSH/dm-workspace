'use client'

import { useEffect, useRef } from 'react'
import { Dices } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MessageWithAuthor } from '@/lib/types'

interface Props {
  messages: MessageWithAuthor[]
  currentUserId: string
  isDm: boolean
  onDelete?: (messageId: string) => void
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function MessageList({
  messages,
  currentUserId,
  isDm,
  onDelete,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <div>
          <Dices size={32} className="text-slate-700 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Пока нет сообщений</p>
          <p className="text-xs text-slate-600 mt-1">
            Броски и сообщения появятся здесь
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-2">
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
              className="text-center text-xs text-slate-500 italic py-1"
            >
              {msg.content}
            </div>
          )
        }

        return (
          <div
            key={msg.id}
            className={cn(
              'group flex flex-col gap-0.5',
              isOwn && 'items-end'
            )}
          >
            {/* Автор */}
            <div className="flex items-center gap-2 text-xs">
              <span
                className={cn(
                  'font-medium',
                  msg.author?.id === msg.user_id
                    ? isOwn
                      ? 'text-indigo-300'
                      : 'text-slate-300'
                    : 'text-slate-300'
                )}
              >
                {msg.author?.display_name ?? msg.author?.username ?? '???'}
              </span>
              <span className="text-slate-600">
                {formatTime(msg.created_at)}
              </span>
              {canDelete && onDelete && (
                <button
                  onClick={() => {
                    if (confirm('Удалить сообщение?')) {
                      onDelete(msg.id)
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition text-[10px]"
                >
                  ×
                </button>
              )}
            </div>

            {/* Контент */}
            {isRoll && roll ? (
              <div
                className={cn(
                  'rounded-lg border px-3 py-2 max-w-[280px]',
                  isOwn
                    ? 'bg-indigo-950/40 border-indigo-900/50'
                    : 'bg-slate-900 border-slate-800'
                )}
              >
                {roll.label && (
                  <div className="text-xs text-slate-400 mb-1">
                    {roll.label}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Dices
                    size={14}
                    className="text-violet-400 shrink-0"
                  />
                  <span className="text-lg font-bold text-violet-300">
                    {roll.total}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
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
                <div className="text-[10px] text-slate-600 mt-0.5 font-mono">
                  {roll.expression}
                </div>
              </div>
            ) : (
              <div
                className={cn(
                  'rounded-lg px-3 py-1.5 max-w-[280px] text-sm whitespace-pre-wrap break-words',
                  isOwn
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-200'
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
  )
}