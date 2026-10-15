'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import CreateCampaignModal from './create-campaign-modal'

export default function CreateCampaignButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition font-medium"
      >
        <Plus size={18} />
        Создать кампанию
      </button>
      {open && <CreateCampaignModal onClose={() => setOpen(false)} />}
    </>
  )
}