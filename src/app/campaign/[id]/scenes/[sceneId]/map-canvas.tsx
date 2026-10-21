'use client'

import { useMemo } from 'react'
import type { Scene } from '@/lib/types'

interface Props {
  scene: Scene
  showGrid?: boolean
}

export default function MapCanvas({ scene, showGrid = true }: Props) {
  const { image_url, width, height, grid_size, grid_type } = scene

  const canvasWidth = width * grid_size
  const canvasHeight = height * grid_size

  const gridLines = useMemo(() => {
    if (!showGrid || grid_type === 'none') return null

    if (grid_type === 'square') {
      const verticals: number[] = []
      const horizontals: number[] = []

      for (let x = 0; x <= width; x++) verticals.push(x * grid_size)
      for (let y = 0; y <= height; y++) horizontals.push(y * grid_size)

      return { type: 'square' as const, verticals, horizontals }
    }

    return null
  }, [width, height, grid_size, grid_type, showGrid])

  return (
    <div
      className="relative overflow-hidden rounded-lg border border-[var(--border-default)] bg-[var(--bg-app)]"
      style={{
        width: canvasWidth,
        height: canvasHeight,
        maxWidth: '100%',
        maxHeight: 'calc(100vh - 200px)',
      }}
    >
      {image_url ? (
        <img
          src={image_url}
          alt={scene.name}
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-[var(--text-subtle)]">
          Карта не загружена
        </div>
      )}

      {gridLines && (
        <svg
          className="pointer-events-none absolute inset-0"
          width={canvasWidth}
          height={canvasHeight}
          style={{ width: '100%', height: '100%' }}
        >
          {gridLines.type === 'square' && (
            <>
              {gridLines.verticals.map((x) => (
                <line
                  key={`v-${x}`}
                  x1={x}
                  y1={0}
                  x2={x}
                  y2={canvasHeight}
                  stroke="var(--border-strong)"
                  strokeOpacity={0.4}
                  strokeWidth={1}
                />
              ))}
              {gridLines.horizontals.map((y) => (
                <line
                  key={`h-${y}`}
                  x1={0}
                  y1={y}
                  x2={canvasWidth}
                  y2={y}
                  stroke="var(--border-strong)"
                  strokeOpacity={0.4}
                  strokeWidth={1}
                />
              ))}
            </>
          )}
        </svg>
      )}
    </div>
  )
}
