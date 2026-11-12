'use client'

import { useEffect, useRef, useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui'
import { useT } from '@/lib/i18n'

/** Key this component by the result text to reset feedback for a new result. */
export function CopyResultButton({ text }: { text: string }) {
  const t = useT()
  const guard = useRef(false)
  const mounted = useRef(true)
  const [status, setStatus] = useState<'idle' | 'pending' | 'copied' | 'error'>('idle')
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  async function copy() {
    if (guard.current) return
    guard.current = true
    setStatus('pending')
    try {
      await navigator.clipboard.writeText(text)
      if (mounted.current) setStatus('copied')
    } catch {
      if (mounted.current) setStatus('error')
    } finally {
      guard.current = false
    }
  }
  return (
    <div className="max-w-full space-y-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="min-h-11"
        disabled={status === 'pending'}
        icon={
          status === 'copied' ? (
            <Check size={14} aria-hidden="true" />
          ) : (
            <Copy size={14} aria-hidden="true" />
          )
        }
        onClick={copy}
      >
        {status === 'pending'
          ? t('generators.copying')
          : status === 'copied'
            ? t('generators.copied')
            : t('generators.copy')}
      </Button>
      {status === 'error' && (
        <p role="alert" className="max-w-64 text-xs leading-5 text-[var(--danger-text)]">
          {t('generators.copyError')}
        </p>
      )}
      <span role="status" className="sr-only">
        {status === 'copied' ? t('generators.copied') : ''}
      </span>
    </div>
  )
}
