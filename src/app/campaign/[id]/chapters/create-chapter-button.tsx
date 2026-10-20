'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import CreateChapterModal from './create-chapter-modal'

interface Props {
  campaignId: string
}

export default function CreateChapterButton({ campaignId }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium transition hover:bg-indigo-500"
      >
        <Plus size={18} />
        Новая глава
      </button>
      {open && <CreateChapterModal campaignId={campaignId} onClose={() => setOpen(false)} />}
    </>
  )
}
