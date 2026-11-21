'use client'

import { useDmScreenContext } from './dm-screen-context'
import DmScreenPanel from './dm-screen-panel'
import { useHotkey } from '@/lib/hooks/use-hotkey'
import type { Entity } from '@/lib/types'

interface Props {
  entities: Entity[]
  campaignId: string
}

export default function DmScreen({ entities, campaignId }: Props) {
  const { toggle } = useDmScreenContext()

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

  return (
    <>
      <DmScreenPanel entities={entities} campaignId={campaignId} />
    </>
  )
}
