'use client'

import { useState, useRef } from 'react'
import type { Scene } from '@/lib/types'

type TemplateType = 'cone' | 'sphere' | 'line'

interface Props {
  scene: Scene
  isActive: boolean
  type: TemplateType
  size: number  // в футах
}

export default function TemplateTool({
  scene,
  isActive,
  type,
  size,
}: Props) {
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
    return {
      x: (e.clientX - rect.left) / gridSize,
      y: (e.clientY - rect.top) / gridSize,
    }
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

  const handleMouseUp = () => {}

  const startPx = start ? { x: start.x * gridSize, y: start.y * gridSize } : null
  const endPx = end ? { x: end.x * gridSize, y: end.y * gridSize } : null

  // Радиус в пикселях (size в футах / 5 футов на клетку)
  const radiusPx = (size / 5) * gridSize

  const renderShape = () => {
    if (!startPx || !endPx || !type) return null

    if (type === 'sphere') {
      const cx = startPx.x
      const cy = startPx.y
      return (
        <>
          <circle
            cx={cx}
            cy={cy}
            r={radiusPx}
            fill="rgba(239, 68, 68, 0.3)"
            stroke="red"
            strokeWidth={2}
          />
          <circle cx={cx} cy={cy} r={4} fill="red" />
        </>
      )
    }

    if (type === 'cone') {
      const dx = endPx.x - startPx.x
      const dy = endPx.y - startPx.y
      const angle = Math.atan2(dy, dx)
      const halfAngle = Math.PI / 6 // 60 градусов / 2

      const x1 = startPx.x + radiusPx * Math.cos(angle - halfAngle)
      const y1 = startPx.y + radiusPx * Math.sin(angle - halfAngle)
      const x2 = startPx.x + radiusPx * Math.cos(angle + halfAngle)
      const y2 = startPx.y + radiusPx * Math.sin(angle + halfAngle)

      return (
        <>
          <path
            d={`M ${startPx.x} ${startPx.y} L ${x1} ${y1} A ${radiusPx} ${radiusPx} 0 0 1 ${x2} ${y2} Z`}
            fill="rgba(239, 68, 68, 0.3)"
            stroke="red"
            strokeWidth={2}
          />
          <circle cx={startPx.x} cy={startPx.y} r={4} fill="red" />
        </>
      )
    }

    if (type === 'line') {
      // Линия шириной 5 футов (1 клетка)
      const dx = endPx.x - startPx.x
      const dy = endPx.y - startPx.y
      const length = Math.sqrt(dx * dx + dy * dy)
      if (length === 0) return null

      const perpendicular = { x: -dy / length, y: dx / length }
      const halfWidth = gridSize / 2

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
        <polygon
          points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`}
          fill="rgba(239, 68, 68, 0.3)"
          stroke="red"
          strokeWidth={2}
        />
      )
    }

    return null
  }

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
        className="absolute inset-0 pointer-events-none"
        style={{ width: '100%', height: '100%' }}
      >
        {renderShape()}
      </svg>
    </div>
  )
}