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

  // CHANGES: на семантических токенах (success), вместо hardcoded green-*
  return (
    <div
      className="flex items-center gap-1.5 rounded-lg border border-[var(--success)]/30 bg-[var(--success-subtle)] px-2 py-1 text-xs text-[var(--success-text)]"
      title={users.map((u) => u.display_name).join(', ')}
    >
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--success)]" />
      <Users size={12} />
      {users.length} онлайн
    </div>
  )
}
