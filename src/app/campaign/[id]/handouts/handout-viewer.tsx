'use client'

import { X, Image as ImageIcon } from 'lucide-react'
import { useState } from 'react'
import Image from 'next/image'
import { useRealtimeHandouts } from '@/lib/hooks/use-realtime-handouts'
import { useT } from '@/lib/i18n'
import type { Handout } from '@/lib/types'

interface Props {
  campaignId: string
  initialHandouts: Handout[]
}

export function HandoutViewer({ campaignId, initialHandouts }: Props) {
  const t = useT()
  const { activeHandout } = useRealtimeHandouts({
    campaignId,
    initialHandouts,
  })
  const [dismissedId, setDismissedId] = useState<string | null>(null)

  if (!activeHandout) return null
  if (dismissedId === activeHandout.id) return null

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-black/95">
      <div className="flex items-center justify-between border-b border-[var(--border-default)] px-4 py-3">
        <div className="flex items-center gap-2 text-white">
          <ImageIcon size={16} />
          <span className="font-semibold">{activeHandout.name}</span>
        </div>
        <button
          onClick={() => setDismissedId(activeHandout.id)}
          className="rounded p-2 text-white transition hover:bg-white/10"
          title={t('common.close')}
        >
          <X size={20} />
        </button>
      </div>
      <div className="relative flex flex-1 items-center justify-center overflow-auto p-4">
        <Image
          src={`/api/handouts/${activeHandout.id}/image`}
          alt={activeHandout.name}
          fill
          sizes="100vw"
          className="object-contain"
          priority
          unoptimized
        />
      </div>
    </div>
  )
}
