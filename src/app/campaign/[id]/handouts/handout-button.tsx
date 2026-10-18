'use client'

import { useState } from 'react'
import { Image as ImageIcon } from 'lucide-react'
import HandoutPanel from './handout-panel'
import type { Handout } from '@/lib/types'

interface Props {
  campaignId: string
  handouts: Handout[]
}

export default function HandoutButton({ campaignId, handouts }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-2 hover:bg-slate-800 rounded-lg transition"
        title="Хендауты"
      >
        <ImageIcon size={16} />
      </button>
      {open && (
        <HandoutPanel
          campaignId={campaignId}
          handouts={handouts}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}