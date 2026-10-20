'use client'

import Link from 'next/link'
import { Plus } from 'lucide-react'

interface Props {
  campaignId: string
}

export default function CreateCharacterButton({ campaignId }: Props) {
  return (
    <Link
      href={`/campaign/${campaignId}/characters/new`}
      className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium transition hover:bg-indigo-500"
    >
      <Plus size={18} />
      Создать персонажа
    </Link>
  )
}
