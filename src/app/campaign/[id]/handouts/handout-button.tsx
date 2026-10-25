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
        className="rounded-lg p-2 transition hover:bg-[var(--bg-hover)]"
        title={t('handouts.open')}
      >
        <ImageIcon size={16} />
      </button>
      {open && (
        <HandoutPanel campaignId={campaignId} handouts={handouts} onClose={() => setOpen(false)} />
      )}
    </>
  )
}
