'use client'

import { useEffect, useRef, useState } from 'react'
import type { Scene } from '@/lib/types'

interface Props {
  scene: Scene
  isActive: boolean
  onClose?: () => void
}

interface Point {
  x: number
  y: number
}

/**
 * CHANGES: полностью переписана логика.
 * 1. Координаты в клетках с округлением (snap to grid).
 * 2. Drag: mousedown → mousemove → mouseup. Escape — сброс.
 * 3. Distance в футах: 5 футов на клетку, округление до целого.
 * 4. Distance в клетках — показываем и то, и то.
 * 5. Добавлен onClose (для сброса активного инструмента).
 */
export default function RulerTool({ scene, isActive, onClose }: Props) {
  const [start, setStart] = useState<Point | null>(null)
  const [end, setEnd] = useState<Point | null>(null)
  const [dragging, setDragging] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const gridSize = scene.grid_size
  const width = scene.width * gridSize
  const height = scene.height * gridSize

  // Сброс по Escape
  useEffect(() => {
    if (!isActive) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setStart(null)
        setEnd(null)
        setDragging(false)
        onClose?.()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isActive, onClose])

  if (!isActive) return null

  const getGridCoords = (e: React.MouseEvent | MouseEvent): Point | null => {
    if (!wrapperRef.current) return null
    const rect = wrapperRef.current.getBoundingClientRect()
    const rawX = (e.clientX - rect.left) / gridSize
    const rawY = (e.clientY - rect.top) / gridSize
    // Snap to nearest intersection
    return {
      x: Math.round(rawX),
      y: Math.round(rawY),
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    const coords = getGridCoords(e)
    if (!coords) return
    setStart(coords)
    setEnd(coords)
    setDragging(true)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return
    const coords = getGridCoords(e)
    if (!coords) return
    setEnd(coords)
  }

  const handleMouseUp = () => {
    setDragging(false)
  }

  const distance =
    start && end ? Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)) : 0

  // 5 футов на клетку, округляем вверх (стандарт D&D: диагональ = 5 футов)
  const feet = Math.max(0, Math.round(distance * 5))

  const startPx = start ? { x: start.x * gridSize, y: start.y * gridSize } : null
  const endPx = end ? { x: end.x * gridSize, y: end.y * gridSize } : null

  return (
    <div
      ref={wrapperRef}
      className="absolute inset-0 z-30"
      style={{ cursor: 'crosshair' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <svg
        width={width}
        height={height}
        className="pointer-events-none absolute inset-0"
        style={{ width: '100%', height: '100%' }}
      >
        {startPx && endPx && (
          <>
            {/* Линия */}
            <line
              x1={startPx.x}
              y1={startPx.y}
              x2={endPx.x}
              y2={endPx.y}
              stroke="var(--accent)"
              strokeWidth={2}
              strokeDasharray="8 4"
            />
            {/* Точки */}
            <circle cx={startPx.x} cy={startPx.y} r={5} fill="var(--accent)" />
            <circle cx={endPx.x} cy={endPx.y} r={5} fill="var(--accent)" />
            {/* Текст с расстоянием */}
            <text
              x={(startPx.x + endPx.x) / 2}
              y={(startPx.y + endPx.y) / 2 - 12}
              textAnchor="middle"
              fill="var(--text-primary)"
              fontSize="13"
              fontWeight="bold"
              style={{
                paintOrder: 'stroke',
                stroke: 'var(--bg-app)',
                strokeWidth: 4,
              }}
            >
              {feet} ft
            </text>
            <text
              x={(startPx.x + endPx.x) / 2}
              y={(startPx.y + endPx.y) / 2 + 18}
              textAnchor="middle"
              fill="var(--text-muted)"
              fontSize="11"
              style={{
                paintOrder: 'stroke',
                stroke: 'var(--bg-app)',
                strokeWidth: 3,
              }}
            >
              {Math.round(distance * 10) / 10} клеток
            </text>
          </>
        )}
      </svg>
    </div>
  )
}
