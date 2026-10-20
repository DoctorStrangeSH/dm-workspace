'use client'

import { useState, useRef } from 'react'
import type { Scene } from '@/lib/types'

interface Props {
  scene: Scene
  isActive: boolean
}

export default function RulerTool({ scene, isActive }: Props) {
  const [start, setStart] = useState<{ x: number; y: number } | null>(null)
  const [end, setEnd] = useState<{ x: number; y: number } | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const gridSize = scene.grid_size
  const width = scene.width * gridSize
  const height = scene.height * gridSize

  if (!isActive) return null

  const getGridCoords = (e: React.MouseEvent) => {
    if (!wrapperRef.current) return null
    const rect = wrapperRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / gridSize
    const y = (e.clientY - rect.top) / gridSize
    return { x, y }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    const coords = getGridCoords(e)
    if (!coords) return
    setStart(coords)
    setEnd(coords)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!start) return
    const coords = getGridCoords(e)
    if (!coords) return
    setEnd(coords)
  }

  const handleMouseUp = () => {
    // Оставляем линейку на экране для наглядности
  }

  // Вычисляем расстояние
  const distance =
    start && end ? Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)) : 0

  const feet = Math.round(distance * 5) // 5 футов на клетку

  // Для отрисовки
  const startPx = start ? { x: start.x * gridSize, y: start.y * gridSize } : null
  const endPx = end ? { x: end.x * gridSize, y: end.y * gridSize } : null

  return (
    <div
      ref={wrapperRef}
      className="absolute inset-0 z-30"
      style={{ cursor: isActive ? 'crosshair' : 'default' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <svg
        width={width}
        height={height}
        className="pointer-events-none absolute inset-0"
        style={{ width: '100%', height: '100%' }}
      >
        {startPx && endPx && (
          <>
            <line
              x1={startPx.x}
              y1={startPx.y}
              x2={endPx.x}
              y2={endPx.y}
              stroke="white"
              strokeWidth={2}
              strokeDasharray="6 4"
            />
            <circle cx={startPx.x} cy={startPx.y} r={4} fill="white" />
            <circle cx={endPx.x} cy={endPx.y} r={4} fill="white" />

            {/* Текст с расстоянием */}
            <text
              x={(startPx.x + endPx.x) / 2}
              y={(startPx.y + endPx.y) / 2 - 10}
              textAnchor="middle"
              fill="white"
              fontSize="14"
              fontWeight="bold"
              style={{ paintOrder: 'stroke', stroke: '#000', strokeWidth: 3 }}
            >
              {feet} ft
            </text>
          </>
        )}
      </svg>
    </div>
  )
}
