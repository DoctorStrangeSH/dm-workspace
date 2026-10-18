'use client'

import { Users } from 'lucide-react'
import { usePresence } from '@/lib/hooks/use-presence'

interface Props {
  campaignId: string
  currentUserId: string
  currentUserName: string
}

export default function PresenceBadge({
  campaignId,
  currentUserId,
  currentUserName,
}: Props) {
  const users = usePresence({
    campaignId,
    currentUserId,
    currentUserName,
  })

  if (users.length === 0) return null

  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1 text-xs bg-green-950/40 border border-green-900/50 text-green-300 rounded-lg"
      title={users.map((u) => u.display_name).join(', ')}
    >
      <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
      <Users size={12} />
      {users.length} онлайн
    </div>
  )
}