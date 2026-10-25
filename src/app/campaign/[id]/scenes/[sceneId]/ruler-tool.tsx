'use client'

import { useEffect, useRef, useState } from 'react'
import { useI18n } from '@/lib/i18n'
import { pluralize } from '@/lib/i18n/plural'
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

export default function RulerTool({ scene, isActive, onClose }: Props) {
  const { t, lang } = useI18n()
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

  const getGridCoords = (e: React.MouseEvent | MouseEvent): Point | null => {
    if (!wrapperRef.current) return null
    const rect = wrapperRef.current.getBoundingClientRect()
    const rawX = (e.clientX - rect.left) / gridSize
    const rawY = (e.clientY - rect.top) / gridSize
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

  const feet = Math.max(0, Math.round(distance * 5))
  const cellsValue = Math.round(distance * 10) / 10

  const cellsLabel = pluralize(lang, Math.round(cellsValue), {
    one: t('scenes.cells.one'),
    few: t('scenes.cells.few'),
    many: t('scenes.cells.many'),
  })

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
            <line
              x1={startPx.x}
              y1={startPx.y}
              x2={endPx.x}
              y2={endPx.y}
              stroke="var(--accent)"
              strokeWidth={2}
              strokeDasharray="8 4"
            />
            <circle cx={startPx.x} cy={startPx.y} r={5} fill="var(--accent)" />
            <circle cx={endPx.x} cy={endPx.y} r={5} fill="var(--accent)" />
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
              {t('common.feetShort', { feet })}
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
              {t('common.cellsValue', { value: cellsValue, label: cellsLabel })}
            </text>
          </>
        )}
      </svg>
    </div>
  )
}
