'use client'

import { useState } from 'react'
import Token from './token'
import TokenMenu from './token-menu'
import { useRealtimeTokens } from '@/lib/hooks/use-realtime-tokens'
import type { Scene, Token as TokenType } from '@/lib/types'

interface Props {
  scene: Scene
  initialTokens: TokenType[]
  isDm: boolean
  currentUserId: string | null
  onRefresh: () => void
}

export default function TokenLayer({
  scene,
  initialTokens,
  isDm,
  currentUserId,
  onRefresh,
}: Props) {
  const { tokens } = useRealtimeTokens({
    sceneId: scene.id,
    initialTokens,
  })

  const [selectedToken, setSelectedToken] = useState<TokenType | null>(null)

  return (
    <>
      <div className="pointer-events-none absolute inset-0">
        <div className="relative h-full w-full" style={{ pointerEvents: 'auto' }}>
          {tokens.map((token) => {
            const canDrag = isDm || token.owner_id === currentUserId
            return (
              <Token
                key={token.id}
                token={token}
                gridSize={scene.grid_size}
                sceneId={scene.id}
                canDrag={canDrag}
                onClick={() => setSelectedToken(token)}
              />
            )
          })}
        </div>
      </div>

      {selectedToken && (
        <TokenMenu
          token={selectedToken}
          scene={scene}
          isDm={isDm}
          currentUserId={currentUserId}
          onClose={() => setSelectedToken(null)}
          onUpdate={onRefresh}
        />
      )}
    </>
  )
}
