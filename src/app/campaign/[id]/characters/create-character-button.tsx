'use client'

import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui'
import { useT } from '@/lib/i18n'

interface Props {
  campaignId: string
}

export default function CreateCharacterButton({ campaignId }: Props) {
  const t = useT()

  return (
    <Link href={`/campaign/${campaignId}/characters/new`}>
      <Button variant="primary" size="md" icon={<Plus size={18} />}>
        {t('characters.create')}
      </Button>
    </Link>
  )
}
