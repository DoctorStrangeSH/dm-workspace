'use client'

import { X, Image as ImageIcon } from 'lucide-react'
import { useState } from 'react'
import { useRealtimeHandouts } from '@/lib/hooks/use-realtime-handouts'
import type { Handout } from '@/lib/types'

interface Props {
  campaignId: string
  initialHandouts: Handout[]
}

export function HandoutViewer({ campaignId, initialHandouts }: Props) {
  const { activeHandout } = useRealtimeHandouts({
    campaignId,
    initialHandouts,
  })
  const [dismissedId, setDismissedId] = useState<string | null>(null)

  if (!activeHandout) return null
  if (dismissedId === activeHandout.id) return null

  return (
    <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2 text-white">
          <ImageIcon size={16} />
          <span className="font-semibold">{activeHandout.name}</span>
        </div>
        <button
          onClick={() => setDismissedId(activeHandout.id)}
          className="p-2 hover:bg-slate-800 rounded transition text-white"
          title="Закрыть"
        >
          <X size={20} />
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
        <img
          src={activeHandout.image_url}
          alt={activeHandout.name}
          className="max-w-full max-h-full object-contain"
        />
      </div>
    </div>
  )
}