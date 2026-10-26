'use client'

import { useState } from 'react'
import Token from './token'
import TokenMenu from './token-menu'
import { useRealtimeTokens } from '@/lib/hooks/use-realtime-tokens'
import { useRealtimeTokenOwners } from '@/lib/hooks/use-realtime-token-owners'
import type { Scene, Token as TokenType, SceneWall, TokenOwnerWithProfile } from '@/lib/types'

interface Props {
  scene: Scene
  initialTokens: TokenType[]
  activeTokenId?: string | null
  isDm: boolean
  currentUserId: string | null
  walls?: SceneWall[]
  initialTokenOwners?: TokenOwnerWithProfile[]
  campaignMembers?: Array<{ user_id: string; username: string; display_name: string | null }>
  onRefresh: () => void
}

export default function TokenLayer({
  scene,
  initialTokens,
  activeTokenId = null,
  isDm,
  currentUserId,
  walls = [],
  initialTokenOwners = [],
  campaignMembers = [],
  onRefresh,
}: Props) {
  // CHANGES: isReady используется для индикатора "Подключение…"
  // (drag НЕ блокируется — иначе первое движение теряется).
  const { tokens, isReady } = useRealtimeTokens({
    sceneId: scene.id,
    initialTokens,
  })

  const { owners } = useRealtimeTokenOwners({
    campaignId: scene.campaign_id,
    initialOwners: initialTokenOwners,
  })

  const [selectedToken, setSelectedToken] = useState<TokenType | null>(null)

  const canDragToken = (token: TokenType) => {
    if (isDm) return true
    if (!currentUserId) return false
    if (token.owner_id === currentUserId) return true
    return owners.some((o) => o.token_id === token.id && o.user_id === currentUserId)
  }

  return (
    <>
      {/* CHANGES: индикатор "Подключение…" — пока канал не SUBSCRIBED */}
      {!isReady && (
        <div className="pointer-events-none absolute top-2 right-2 z-30 rounded bg-[var(--warning-subtle)] px-2 py-1 text-[10px] text-[var(--warning-text)]">
          Подключение…
        </div>
      )}

      <div className="pointer-events-none absolute inset-0">
        <div className="relative h-full w-full" style={{ pointerEvents: 'auto' }}>
          {tokens.map((token) => (
            <Token
              key={token.id}
              token={token}
              isActiveTurn={token.id === activeTokenId}
              gridSize={scene.grid_size}
              sceneId={scene.id}
              canDrag={canDragToken(token)}
              walls={walls}
              onClick={() => setSelectedToken(token)}
            />
          ))}
        </div>
      </div>

      {selectedToken && (
        <TokenMenu
          token={selectedToken}
          scene={scene}
          isDm={isDm}
          currentUserId={currentUserId}
          campaignMembers={campaignMembers}
          tokenOwners={owners}
          onClose={() => setSelectedToken(null)}
          onUpdate={onRefresh}
        />
      )}
    </>
  )
}
