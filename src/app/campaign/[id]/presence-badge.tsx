'use client'

import { Users } from 'lucide-react'
import { usePresence } from '@/lib/hooks/use-presence'

interface Props {
  campaignId: string
  currentUserId: string
  currentUserName: string
}

export default function PresenceBadge({ campaignId, currentUserId, currentUserName }: Props) {
  const users = usePresence({
    campaignId,
    currentUserId,
    currentUserName,
  })

  if (users.length === 0) return null

  return (
    <div
      className="flex items-center gap-1.5 rounded-lg border border-green-900/50 bg-green-950/40 px-2 py-1 text-xs text-green-300"
      title={users.map((u) => u.display_name).join(', ')}
    >
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
      <Users size={12} />
      {users.length} онлайн
    </div>
  )
}
