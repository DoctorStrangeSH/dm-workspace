'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import CreateEntityModal from './create-entity-modal'
import { Button } from '@/components/ui'
import { useT } from '@/lib/i18n'
import type { EntityTemplate, EntityType } from '@/lib/types'

interface Props {
  campaignId: string
  defaultType?: EntityType
  templates: EntityTemplate[]
}

export default function CreateEntityButton({ campaignId, defaultType, templates }: Props) {
  const t = useT()
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="primary" size="md" icon={<Plus size={18} />} onClick={() => setOpen(true)}>
        {t('entities.create')}
      </Button>
      {open && (
        <CreateEntityModal
          campaignId={campaignId}
          defaultType={defaultType}
          templates={templates}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
