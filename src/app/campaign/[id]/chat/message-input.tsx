'use client'

import { useState } from 'react'
import { Send, EyeOff } from 'lucide-react'
import { useT } from '@/lib/i18n'
import { cn } from '@/lib/utils'

interface Props {
  onSend: (content: string, isHidden: boolean) => void
  disabled?: boolean
  canHide?: boolean
}

export default function MessageInput({ onSend, disabled, canHide = false }: Props) {
  const t = useT()
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
    <form onSubmit={handleSubmit} className="border-t border-[var(--border-default)] p-3">
      {canHide && (
        <button
          type="button"
          onClick={() => setIsHidden(!isHidden)}
          className={cn(
            'mb-2 flex items-center gap-1.5 text-xs transition',
            isHidden
              ? 'text-[var(--warning-text)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          )}
        >
          <EyeOff size={12} />
          {isHidden ? t('chat.hiddenRollOn') : t('chat.hiddenRollOff')}
        </button>
      )}

      <div className="flex items-end gap-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('chat.messagePlaceholder')}
          disabled={disabled}
          rows={1}
          className="max-h-32 flex-1 resize-none rounded-lg border border-[var(--border-default)] bg-[var(--bg-app)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-subtle)] focus:border-[var(--border-focus)] focus:outline-none"
          style={{ minHeight: '40px' }}
        />
        <button
          type="submit"
          disabled={disabled || !content.trim()}
          className="rounded-lg bg-[var(--accent)] p-2.5 text-white transition hover:bg-[var(--accent-hover)] disabled:opacity-50"
          title={t('chat.sendHint')}
        >
          <Send size={16} />
        </button>
      </div>
    </form>
  )
}
