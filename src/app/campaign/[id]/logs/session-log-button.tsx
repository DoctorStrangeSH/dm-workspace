'use client'

import { useState } from 'react'
import { ScrollText } from 'lucide-react'
import SessionLogPanel from './session-log-panel'
import { useT } from '@/lib/i18n'
import type { SessionLogWithActor } from '@/lib/queries/logs'

interface Props {
  campaignId: string
  log: SessionLogWithActor[]
  isDm: boolean
}

export default function SessionLogButton({ campaignId, log, isDm }: Props) {
  const t = useT()
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg p-2 transition hover:bg-[var(--bg-hover)]"
        title={t('logs.open')}
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
