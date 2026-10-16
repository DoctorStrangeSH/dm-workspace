'use client'

import { useState, useEffect, useCallback } from 'react'
import type { EditorView } from '@codemirror/view'
import type { EntitySuggestion } from '@/lib/codemirror/wikilink-completion'

interface WikilinkTrigger {
  isOpen: boolean
  query: string
  start: number
  end: number
  position: { top: number; left: number } | null
}

export function useWikilinkTrigger(
  view: EditorView | undefined,
  entities: EntitySuggestion[]
) {
  const [trigger, setTrigger] = useState<WikilinkTrigger>({
    isOpen: false,
    query: '',
    start: 0,
    end: 0,
    position: null,
  })

  const checkTrigger = useCallback(() => {
    if (!view) return

    const pos = view.state.selection.main.from
    const textBefore = view.state.sliceDoc(Math.max(0, pos - 200), pos)

    // Ищем последнее `[[` без закрывающего `]]`
    const match = textBefore.match(/\[\[([^\]]*)$/)

    if (!match) {
      setTrigger((t) => (t.isOpen ? { ...t, isOpen: false } : t))
      return
    }

    const query = match[1]
    const start = pos - query.length - 2

    // Позиция курсора в координатах экрана
    const coords = view.coordsAtPos(pos)
    if (!coords) return

    // Позиция относительно редактора
    const editorRect = view.dom.getBoundingClientRect()

    setTrigger({
      isOpen: true,
      query,
      start,
      end: pos,
      position: {
        top: coords.bottom - editorRect.top + 4,
        left: coords.left - editorRect.left,
      },
    })
  }, [view])

  useEffect(() => {
    if (!view) return

    // Слушаем изменения документа и выделения
    const updateListener = () => {
      checkTrigger()
    }

    const cleanup = view.dom.addEventListener('keyup', updateListener)
    const cleanup2 = view.dom.addEventListener('click', updateListener)

    // CM6 extension для отслеживания изменений
    const observer = new MutationObserver(updateListener)
    observer.observe(view.dom, { childList: true, subtree: true, characterData: true })

    return () => {
      view.dom.removeEventListener('keyup', updateListener)
      view.dom.removeEventListener('click', updateListener)
      observer.disconnect()
    }
  }, [view, checkTrigger])

  return {
    trigger,
    close: () => setTrigger((t) => ({ ...t, isOpen: false })),
  }
}