'use client'

import { useState } from 'react'
import { Send, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  onSend: (content: string, isHidden: boolean) => void
  disabled?: boolean
  canHide?: boolean
}

export default function MessageInput({
  onSend,
  disabled,
  canHide = false,
}: Props) {
  const [content, setContent] = useState('')
  const [isHidden, setIsHidden] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    onSend(content.trim(), isHidden)
    setContent('')
    setIsHidden(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-slate-800 p-3">
      {canHide && (
        <button
          type="button"
          onClick={() => setIsHidden(!isHidden)}
          className={cn(
            'flex items-center gap-1.5 text-xs mb-2 transition',
            isHidden ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'
          )}
        >
          <EyeOff size={12} />
          {isHidden ? 'Скрытый бросок (только для ГМ)' : 'Скрыть бросок от игроков'}
        </button>
      )}

      <div className="flex items-end gap-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Сообщение..."
          disabled={disabled}
          rows={1}
          className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 resize-none max-h-32"
          style={{ minHeight: '40px' }}
        />
        <button
          type="submit"
          disabled={disabled || !content.trim()}
          className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition disabled:opacity-50"
          title="Отправить (Enter)"
        >
          <Send size={16} />
        </button>
      </div>
    </form>
  )
}