'use client'

import { useState } from 'react'
import { Image as ImageIcon } from 'lucide-react'
import HandoutPanel from './handout-panel'
import { useT } from '@/lib/i18n'
import type { Handout } from '@/lib/types'

interface Props {
  campaignId: string
  handouts: Handout[]
}

export default function HandoutButton({ campaignId, handouts }: Props) {
  const t = useT()
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl px-3 text-sm text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
        aria-label={t('handouts.open')}
        title={t('handouts.open')}
      >
        <ImageIcon size={17} aria-hidden="true" />
        <span className="hidden xl:inline">{t('handouts.open')}</span>
      </button>
      {open && (
        <HandoutPanel campaignId={campaignId} handouts={handouts} onClose={() => setOpen(false)} />
      )}
    </>
  )
}
