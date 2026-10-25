'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui'
import { useT } from '@/lib/i18n'
import CreateCampaignModal from './create-campaign-modal'

export default function CreateCampaignButton() {
  const t = useT()
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="primary" size="md" icon={<Plus size={18} />} onClick={() => setOpen(true)}>
        {t('campaign.create')}
      </Button>
      {open && <CreateCampaignModal onClose={() => setOpen(false)} />}
    </>
  )
}
