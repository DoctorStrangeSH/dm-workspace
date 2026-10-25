'use client'

import { useRealtimeWalls } from '@/lib/hooks/use-realtime-walls'
import type { Scene, SceneWall } from '@/lib/types'

interface Props {
  scene: Scene
  initialWalls: SceneWall[]
  isDm: boolean
  previewWall?: { x1: number; y1: number; x2: number; y2: number } | null
  onWallClick?: (wallId: string) => void
}

export default function WallsLayer({ scene, initialWalls, isDm, previewWall, onWallClick }: Props) {
  // CHANGES: один хук — useRealtimeWalls (канал campaign:<id>, private: true).
  // Синхронизация с initialWalls (localWalls) — через prev-pattern внутри хука.
  const { walls } = useRealtimeWalls({
    sceneId: scene.id,
    campaignId: scene.campaign_id,
    initialWalls,
  })

  const gridSize = scene.grid_size
  const width = scene.width * gridSize
  const height = scene.height * gridSize

  const renderWall = (
    wall: SceneWall | { x1: number; y1: number; x2: number; y2: number },
    isPreview = false,
    id?: string
  ) => {
    const x1 = wall.x1 * gridSize
    const y1 = wall.y1 * gridSize
    const x2 = wall.x2 * gridSize
    const y2 = wall.y2 * gridSize

    return (
      <g
        key={id ?? 'preview'}
        className={isDm && onWallClick && !isPreview ? 'cursor-pointer' : undefined}
      >
        {isDm && onWallClick && !isPreview && (
          <line
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="transparent"
            strokeWidth={16}
            onClick={(e) => {
              e.stopPropagation()
              onWallClick(id!)
            }}
          />
        )}
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={isPreview ? 'var(--accent)' : ('color' in wall && wall.color) || 'var(--danger)'}
          strokeWidth={3}
          strokeDasharray={isPreview ? '6 4' : undefined}
          strokeLinecap="round"
          opacity={isPreview ? 0.6 : 1}
          style={{ pointerEvents: 'none' }}
        />
      </g>
    )
  }

  return (
    <svg
      className="pointer-events-none absolute inset-0"
      width={width}
      height={height}
      style={{ width: '100%', height: '100%' }}
    >
      <g className="pointer-events-auto">
        {walls.map((w) => renderWall(w, false, w.id))}
        {previewWall && renderWall(previewWall, true)}
      </g>
    </svg>
  )
}
