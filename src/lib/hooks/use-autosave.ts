'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface Options<T> {
  value: T
  onSave: (value: T) => Promise<{ success?: boolean; error?: string }>
  delay?: number
  enabled?: boolean
}

export function useAutosave<T>({
  value,
  onSave,
  delay = 1500,
  enabled = true,
}: Options<T>) {
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const latestValueRef = useRef(value)
  const isFirstRenderRef = useRef(true)
  const savingRef = useRef(false)

  useEffect(() => {
    latestValueRef.current = value
  }, [value])

  const saveNow = useCallback(async () => {
    if (savingRef.current) return
    savingRef.current = true
    setStatus('saving')
    setError(null)

    try {
      const res = await onSave(latestValueRef.current)
      if (res.error) {
        setStatus('error')
        setError(res.error)
      } else {
        setStatus('saved')
        setLastSaved(new Date())
        setTimeout(() => {
          setStatus((s) => (s === 'saved' ? 'idle' : s))
        }, 2000)
      }
    } catch (e) {
      console.error('autosave error', e)
      setStatus('error')
      setError('Ошибка сохранения')
    } finally {
      savingRef.current = false
    }
  }, [onSave])

  useEffect(() => {
    if (!enabled) return

    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false
      return
    }

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      saveNow()
    }, delay)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [value, delay, enabled, saveNow])

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (timerRef.current) clearTimeout(timerRef.current)
        saveNow()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enabled, saveNow])

  useEffect(() => {
    if (!enabled) return
    if (status === 'saving' || status === 'error') {
      const handler = (e: BeforeUnloadEvent) => {
        e.preventDefault()
        e.returnValue = ''
      }
      window.addEventListener('beforeunload', handler)
      return () => window.removeEventListener('beforeunload', handler)
    }
  }, [status, enabled])

  return { status, lastSaved, error, saveNow }
}