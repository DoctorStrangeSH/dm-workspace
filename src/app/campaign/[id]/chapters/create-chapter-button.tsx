'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import CreateChapterModal from './create-chapter-modal'
import { useT } from '@/lib/i18n'
import { Button } from '@/components/ui'

interface Props {
  campaignId: string
}

export default function CreateChapterButton({ campaignId }: Props) {
  const [open, setOpen] = useState(false)
  const t = useT()

  return (
    <>
      <Button icon={<Plus size={18} />} onClick={() => setOpen(true)} className="min-h-11">
        {t('chapters.create')}
      </Button>
      {open && <CreateChapterModal campaignId={campaignId} onClose={() => setOpen(false)} />}
    </>
  )
}
