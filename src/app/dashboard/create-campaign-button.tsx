'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui'
import CreateCampaignModal from './create-campaign-modal'

export default function CreateCampaignButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="primary" size="md" icon={<Plus size={18} />} onClick={() => setOpen(true)}>
        Создать кампанию
      </Button>
      {open && <CreateCampaignModal onClose={() => setOpen(false)} />}
    </>
  )
}
