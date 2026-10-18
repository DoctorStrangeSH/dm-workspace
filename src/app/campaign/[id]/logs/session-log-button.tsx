'use client'

import { useState } from 'react'
import { ScrollText } from 'lucide-react'
import SessionLogPanel from './session-log-panel'
import type { SessionLogWithActor } from '@/lib/queries/logs'

interface Props {
  campaignId: string
  log: SessionLogWithActor[]
  isDm: boolean
}

export default function SessionLogButton({
  campaignId,
  log,
  isDm,
}: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-2 hover:bg-slate-800 rounded-lg transition"
        title="Записи сессии"
      >
        <ScrollText size={16} />
      </button>
      {open && (
        <SessionLogPanel
          campaignId={campaignId}
          initialLog={log}
          isDm={isDm}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}