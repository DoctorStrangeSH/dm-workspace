'use client'

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
  const { toggle } = useDmScreenContext()

  // Ctrl+M / Cmd+M — открыть/закрыть панель
  useHotkey({
    code: 'KeyM',
    ctrl: true,
    handler: (e) => {
      e.preventDefault()
      toggle()
    },
    ignoreInInputs: false, // работает даже в редакторе
  })

  return (
    <>
      <DmScreenButton />
      <DmScreenPanel entities={entities} campaignId={campaignId} />
    </>
  )
}