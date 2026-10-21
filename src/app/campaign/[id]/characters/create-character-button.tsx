'use client'

import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui'

interface Props {
  campaignId: string
}

export default function CreateCharacterButton({ campaignId }: Props) {
  return (
    <Link href={`/campaign/${campaignId}/characters/new`}>
      <Button variant="primary" size="md" icon={<Plus size={18} />}>
        Создать персонажа
      </Button>
    </Link>
  )
}
