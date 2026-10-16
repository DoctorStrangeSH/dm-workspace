'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import CreateEntityModal from './create-entity-modal'
import type { EntityType } from '@/lib/types'

interface Props {
  campaignId: string
  defaultType?: EntityType
}

export default function CreateEntityButton({
  campaignId,
  defaultType,
}: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition font-medium"
      >
        <Plus size={18} />
        Новая сущность
      </button>
      {open && (
        <CreateEntityModal
          campaignId={campaignId}
          defaultType={defaultType}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}