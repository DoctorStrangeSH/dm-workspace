'use client'

import { useId, useLayoutEffect, useRef, useState, useTransition } from 'react'
import { Loader2, Send } from 'lucide-react'
import { useT } from '@/lib/i18n'

interface Props {
  onSend: (content: string) => Promise<boolean>
  disabled?: boolean
}

export default function MessageInput({ onSend, disabled }: Props) {
  const t = useT()
  const errorId = useId()
  const [content, setContent] = useState('')
  const [failed, setFailed] = useState(false)
  const [pending, startTransition] = useTransition()
  const sending = useRef(false)
  const input = useRef<HTMLTextAreaElement>(null)
  useLayoutEffect(() => {
    if (!input.current) return
    input.current.style.height = 'auto'
    input.current.style.height = `${Math.min(input.current.scrollHeight, 160)}px`
  }, [content])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const draft = content.trim()
    if (disabled || sending.current || !draft || draft.length > 5000) return
    sending.current = true
    setFailed(false)
    startTransition(async () => {
      try {
        const sent = await onSend(draft)
        if (sent) setContent('')
        else setFailed(true)
      } catch {
        setFailed(true)
      } finally {
        sending.current = false
      }
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="shrink-0 border-t border-[var(--border-default)] bg-[var(--bg-elevated)] p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
    >
      <div className="rounded-2xl border border-[var(--border-hover)] bg-[var(--bg-app)] p-2 transition-shadow focus-within:border-[var(--border-focus)] focus-within:ring-2 focus-within:ring-[var(--accent-subtle)]">
        <textarea
          ref={input}
          value={content}
          onChange={(event) => {
            setContent(event.target.value)
            setFailed(false)
          }}
          onKeyDown={(event) => {
            if (
              event.key === 'Enter' &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing &&
              event.keyCode !== 229
            )
              handleSubmit(event)
          }}
          placeholder={t('chat.messagePlaceholder')}
          aria-label={t('chat.messagePlaceholder')}
          aria-describedby={failed ? errorId : undefined}
          disabled={disabled || pending}
          maxLength={5000}
          rows={2}
          className="block max-h-40 min-h-14 w-full resize-none overflow-y-auto bg-transparent px-2 py-1.5 text-base leading-relaxed text-[var(--text-primary)] placeholder:text-[var(--text-subtle)] focus:outline-none sm:text-sm"
        />
        <div className="flex items-center justify-between gap-2 pl-2">
          <span className="text-[11px] leading-relaxed text-[var(--text-muted)]">
            {content.length >= 4000 ? `${content.length} / 5000` : t('chat.inputHint')}
          </span>
          <button
            type="submit"
            disabled={disabled || pending || !content.trim()}
            aria-label={t('chat.sendHint')}
            aria-busy={pending}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)] shadow-sm transition hover:bg-[var(--accent-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pending ? (
              <Loader2 size={18} className="animate-spin" aria-hidden="true" />
            ) : (
              <Send size={18} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
      {failed && (
        <p id={errorId} role="alert" className="mt-2 text-xs text-[var(--danger-text)]">
          {t('chat.sendFailed')}
        </p>
      )}
    </form>
  )
}
