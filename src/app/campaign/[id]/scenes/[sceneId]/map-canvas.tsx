'use client'

import { useMemo } from 'react'
import type { Scene } from '@/lib/types'

interface Props {
  scene: Scene
  /** Показывать ли сетку (для ГМ) */
  showGrid?: boolean
}

export default function MapCanvas({ scene, showGrid = true }: Props) {
  const { image_url, width, height, grid_size, grid_type } = scene

  // Размеры canvas в пикселях
  const canvasWidth = width * grid_size
  const canvasHeight = height * grid_size

  // Генерируем линии сетки
  const gridLines = useMemo(() => {
    if (!showGrid || grid_type === 'none') return null

    if (grid_type === 'square') {
      const verticals: number[] = []
      const horizontals: number[] = []

      for (let x = 0; x <= width; x++) {
        verticals.push(x * grid_size)
      }
      for (let y = 0; y <= height; y++) {
        horizontals.push(y * grid_size)
      }

      return { type: 'square' as const, verticals, horizontals }
    }

    // hex — пропускаем для MVP, будет позже
    return null
  }, [width, height, grid_size, grid_type, showGrid])

  return (
    <div
      className="relative bg-slate-950 border border-slate-800 rounded-lg overflow-hidden"
      style={{
        width: canvasWidth,
        height: canvasHeight,
        maxWidth: '100%',
        maxHeight: 'calc(100vh - 200px)',
      }}
    >
      {/* Карта (если загружена) */}
      {image_url ? (
        <img
          src={image_url}
          alt={scene.name}
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-slate-600">
          Карта не загружена
        </div>
      )}

      {/* Сетка (SVG) */}
      {gridLines && (
        <svg
          className="absolute inset-0 pointer-events-none"
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
                  stroke="rgba(148, 163, 184, 0.3)"
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
                  stroke="rgba(148, 163, 184, 0.3)"
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