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
        className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl px-3 text-sm text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
        aria-label={t('logs.open')}
        title={t('logs.open')}
      >
        <ScrollText size={17} aria-hidden="true" />
        <span className="hidden xl:inline">{t('logs.open')}</span>
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
