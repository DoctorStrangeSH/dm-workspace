'use client'

import { useEffect, useRef, useState } from 'react'
import type { Scene } from '@/lib/types'

type TemplateType = 'cone' | 'sphere' | 'line'

interface Props {
  scene: Scene
  isActive: boolean
  type: TemplateType
  size: number // в футах
  onClose?: () => void
}

interface Point {
  x: number
  y: number
}

/**
 * CHANGES: полностью переписана логика.
 * 1. Snap to grid (округление до пересечений).
 * 2. Конус — 60° (стандарт D&D), начало в start, направление — на end.
 * 3. Сфера — центр в start, радиус = size/5 клеток.
 * 4. Линия — от start до end, ширина 5 футов (1 клетка).
 * 5. Escape — сброс.
 */
export default function TemplateTool({ scene, isActive, type, size, onClose }: Props) {
  const [start, setStart] = useState<Point | null>(null)
  const [end, setEnd] = useState<Point | null>(null)
  const [dragging, setDragging] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const gridSize = scene.grid_size
  const width = scene.width * gridSize
  const height = scene.height * gridSize

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

  const getGridCoords = (e: React.MouseEvent): Point | null => {
    if (!wrapperRef.current) return null
    const rect = wrapperRef.current.getBoundingClientRect()
    return {
      x: Math.round((e.clientX - rect.left) / gridSize),
      y: Math.round((e.clientY - rect.top) / gridSize),
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

  const startPx = start ? { x: start.x * gridSize, y: start.y * gridSize } : null
  const endPx = end ? { x: end.x * gridSize, y: end.y * gridSize } : null

  const radiusPx = (size / 5) * gridSize

  const renderShape = () => {
    if (!startPx || !endPx) return null

    // ─── Сфера ───
    if (type === 'sphere') {
      return (
        <>
          <circle
            cx={startPx.x}
            cy={startPx.y}
            r={radiusPx}
            fill="rgba(239, 68, 68, 0.25)"
            stroke="var(--danger)"
            strokeWidth={2}
          />
          <circle cx={startPx.x} cy={startPx.y} r={4} fill="var(--danger)" />
          <text
            x={startPx.x}
            y={startPx.y - radiusPx - 8}
            textAnchor="middle"
            fill="var(--text-primary)"
            fontSize="12"
            fontWeight="bold"
            style={{ paintOrder: 'stroke', stroke: 'var(--bg-app)', strokeWidth: 3 }}
          >
            {size} ft
          </text>
        </>
      )
    }

    // ─── Конус ───
    if (type === 'cone') {
      const dx = endPx.x - startPx.x
      const dy = endPx.y - startPx.y

      // Если end совпадает с start — не рисуем
      if (dx === 0 && dy === 0) return null

      const angle = Math.atan2(dy, dx)
      const halfAngle = Math.PI / 6 // 30° (60° общий)

      const x1 = startPx.x + radiusPx * Math.cos(angle - halfAngle)
      const y1 = startPx.y + radiusPx * Math.sin(angle - halfAngle)
      const x2 = startPx.x + radiusPx * Math.cos(angle + halfAngle)
      const y2 = startPx.y + radiusPx * Math.sin(angle + halfAngle)

      const largeArc = Math.PI / 3 > Math.PI ? 1 : 0

      return (
        <>
          <path
            d={`M ${startPx.x} ${startPx.y} L ${x1} ${y1} A ${radiusPx} ${radiusPx} 0 ${largeArc} 1 ${x2} ${y2} Z`}
            fill="rgba(239, 68, 68, 0.25)"
            stroke="var(--danger)"
            strokeWidth={2}
          />
          <circle cx={startPx.x} cy={startPx.y} r={4} fill="var(--danger)" />
          <text
            x={startPx.x + Math.cos(angle) * radiusPx * 0.6}
            y={startPx.y + Math.sin(angle) * radiusPx * 0.6}
            textAnchor="middle"
            fill="var(--text-primary)"
            fontSize="12"
            fontWeight="bold"
            style={{ paintOrder: 'stroke', stroke: 'var(--bg-app)', strokeWidth: 3 }}
          >
            {size} ft
          </text>
        </>
      )
    }

    // ─── Линия ───
    if (type === 'line') {
      const dx = endPx.x - startPx.x
      const dy = endPx.y - startPx.y
      const length = Math.sqrt(dx * dx + dy * dy)
      if (length === 0) return null

      const perpendicular = { x: -dy / length, y: dx / length }
      const halfWidth = gridSize / 2 // 5 футов = 1 клетка

      const p1 = {
        x: startPx.x + perpendicular.x * halfWidth,
        y: startPx.y + perpendicular.y * halfWidth,
      }
      const p2 = {
        x: startPx.x - perpendicular.x * halfWidth,
        y: startPx.y - perpendicular.y * halfWidth,
      }
      const p3 = {
        x: endPx.x - perpendicular.x * halfWidth,
        y: endPx.y - perpendicular.y * halfWidth,
      }
      const p4 = {
        x: endPx.x + perpendicular.x * halfWidth,
        y: endPx.y + perpendicular.y * halfWidth,
      }

      return (
        <>
          <polygon
            points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`}
            fill="rgba(239, 68, 68, 0.25)"
            stroke="var(--danger)"
            strokeWidth={2}
          />
          <text
            x={(startPx.x + endPx.x) / 2}
            y={(startPx.y + endPx.y) / 2 - 10}
            textAnchor="middle"
            fill="var(--text-primary)"
            fontSize="12"
            fontWeight="bold"
            style={{ paintOrder: 'stroke', stroke: 'var(--bg-app)', strokeWidth: 3 }}
          >
            {Math.round((length / gridSize) * 5)} ft
          </text>
        </>
      )
    }

    return null
  }

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
        {renderShape()}
      </svg>
    </div>
  )
}
