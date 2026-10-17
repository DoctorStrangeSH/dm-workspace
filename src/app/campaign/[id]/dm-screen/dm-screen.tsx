'use client'

import { useEffect } from 'react'
import { useDmScreenContext } from './dm-screen-context'
import DmScreenButton from './dm-screen-button'
import DmScreenPanel from './dm-screen-panel'
import { useHotkey } from '@/lib/hooks/use-hotkey'
import type { Entity } from '@/lib/types'

interface Props {
  entities: Entity[]
  campaignId: string
}

export default function DmScreen({ entities, campaignId }: Props) {
  const { toggle, open } = useDmScreenContext()

  // Ctrl+M — открыть/закрыть
  useHotkey({
    code: 'KeyM',
    ctrl: true,
    handler: (e) => {
      e.preventDefault()
      toggle()
    },
    ignoreInInputs: false,
  })

  // Слушаем кастомное событие из палитры команд
  useEffect(() => {
    const handler = () => open()
    window.addEventListener('dm-screen:open', handler)
    return () => window.removeEventListener('dm-screen:open', handler)
  }, [open])

  return (
    <>
      <DmScreenButton />
      <DmScreenPanel entities={entities} campaignId={campaignId} />
    </>
  )
}