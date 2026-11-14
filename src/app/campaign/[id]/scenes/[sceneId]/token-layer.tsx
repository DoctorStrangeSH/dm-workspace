'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useT } from '@/lib/i18n'
import Token from './token'
import TokenMenu from './token-menu'
import { useRealtimeTokenOwners } from '@/lib/hooks/use-realtime-token-owners'
import type { Scene, Token as TokenType, SceneWall, TokenOwnerWithProfile } from '@/lib/types'

interface Props {
  scene: Scene
  zoomScale?: number
  activeTokenId?: string | null
  tokens: TokenType[]
  isReady: boolean
  isDm: boolean
  currentUserId: string | null
  walls?: SceneWall[]
  initialTokenOwners?: TokenOwnerWithProfile[]
  campaignMembers?: Array<{ user_id: string; username: string; display_name: string | null }>
  onRefresh: () => void
}

export default function TokenLayer({
  scene,
  zoomScale = 1,
  activeTokenId = null,
  tokens,
  isReady,
  isDm,
  currentUserId,
  walls = [],
  initialTokenOwners = [],
  campaignMembers = [],
  onRefresh,
}: Props) {
  const t = useT()
  const { owners } = useRealtimeTokenOwners({
    campaignId: scene.campaign_id,
    initialOwners: initialTokenOwners,
  })

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selectedToken = tokens.find((token) => token.id === selectedId) ?? null

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
          {t('map.connecting')}
        </div>
      )}

      <div className="pointer-events-none absolute inset-0">
        <div className="relative h-full w-full" style={{ pointerEvents: 'auto' }}>
          {tokens.map((token) => (
            <Token
              key={token.id}
              token={token}
              gridSize={scene.grid_size}
              zoomScale={zoomScale}
              isActiveTurn={token.id === activeTokenId}
              sceneId={scene.id}
              canDrag={canDragToken(token)}
              walls={walls}
              onClick={() => setSelectedId(token.id)}
            />
          ))}
        </div>
      </div>

      {selectedToken &&
        createPortal(
          <TokenMenu
            token={selectedToken}
            scene={scene}
            isDm={isDm}
            currentUserId={currentUserId}
            campaignMembers={campaignMembers}
            tokenOwners={owners}
            onClose={() => setSelectedId(null)}
            onUpdate={onRefresh}
          />,
          document.fullscreenElement ?? document.body
        )}
    </>
  )
}
