'use client'

import { useRef } from 'react'
import type { RefObject } from 'react'
import { useT } from '@/lib/i18n'
import { clientToGrid } from '@/lib/maps/geometry'
import { spellArea } from '@/lib/maps/spell-areas'
import type { AreaPlacement, AreaShape } from '@/lib/maps/spell-areas'
import type { Scene } from '@/lib/types'

interface Props {
  scene: Scene
  layerRef: RefObject<HTMLDivElement | null>
  type: AreaShape
  size: number
  zoom: number
  lineWidth: number
  placement: AreaPlacement | null
  onChange: (placement: AreaPlacement | null) => void
  onClose: () => void
}

export default function TemplateTool({
  scene,
  type,
  size,
  zoom,
  lineWidth,
  placement,
  onChange,
  onClose,
  layerRef,
}: Props) {
  const t = useT()
  const gesture = useRef<{
    id: number
    origin: { x: number; y: number }
    previous: AreaPlacement | null
  } | null>(null)
  const grid = scene.grid_size
  const textScale = 1 / Math.max(0.05, zoom)
  const coords = (event: React.PointerEvent<HTMLDivElement>) =>
    clientToGrid(
      event,
      event.currentTarget.getBoundingClientRect(),
      scene.width,
      scene.height,
      'vertex'
    )
  const updateDirection = (event: React.PointerEvent<HTMLDivElement>) => {
    const active = gesture.current
    if (!active || active.id !== event.pointerId) return
    const end = coords(event)
    const dx = end.x - active.origin.x
    const dy = end.y - active.origin.y
    onChange({
      origin: active.origin,
      angle: dx || dy ? Math.atan2(dy, dx) : (placement?.angle ?? 0),
    })
  }
  const cancelGesture = () => {
    const active = gesture.current
    gesture.current = null
    if (active) onChange(active.previous)
  }
  const shape = placement ? spellArea(type, size, lineWidth, placement) : null
  return (
    <div
      ref={layerRef}
      tabIndex={0}
      role="group"
      aria-label={t('areas.canvas')}
      data-testid="spell-area-layer"
      className="absolute inset-0 z-30 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[var(--focus-ring)]"
      style={{ cursor: 'crosshair', touchAction: 'none' }}
      onPointerDown={(event) => {
        if (!event.isPrimary || event.button !== 0) return
        event.preventDefault()
        event.stopPropagation()
        event.currentTarget.focus({ preventScroll: true })
        const origin = coords(event)
        gesture.current = { id: event.pointerId, origin, previous: placement }
        event.currentTarget.setPointerCapture(event.pointerId)
        onChange({ origin, angle: placement?.angle ?? 0 })
      }}
      onPointerMove={updateDirection}
      onPointerUp={(event) => {
        if (gesture.current?.id !== event.pointerId) return
        updateDirection(event)
        gesture.current = null
        if (event.currentTarget.hasPointerCapture(event.pointerId))
          event.currentTarget.releasePointerCapture(event.pointerId)
      }}
      onPointerCancel={cancelGesture}
      onLostPointerCapture={cancelGesture}
      onKeyDown={(event) => {
        if (event.ctrlKey || event.metaKey || event.altKey) return
        if (event.key === 'Escape') {
          event.preventDefault()
          event.stopPropagation()
          gesture.current = null
          onClose()
          return
        }
        if (event.key === 'Enter' || event.key === 'Home') {
          event.preventDefault()
          onChange({
            origin: { x: Math.round(scene.width / 2), y: Math.round(scene.height / 2) },
            angle: 0,
          })
          return
        }
        const directions: Record<string, number[]> = {
          ArrowLeft: [-1, 0],
          ArrowRight: [1, 0],
          ArrowUp: [0, -1],
          ArrowDown: [0, 1],
        }
        const direction = directions[event.key]
        if (!direction) return
        event.preventDefault()
        const current = placement ?? {
          origin: { x: Math.round(scene.width / 2), y: Math.round(scene.height / 2) },
          angle: 0,
        }
        onChange(
          event.shiftKey
            ? {
                ...current,
                angle:
                  current.angle +
                  ((event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1) * Math.PI) / 12,
              }
            : {
                ...current,
                origin: {
                  x: Math.max(0, Math.min(scene.width, current.origin.x + direction[0])),
                  y: Math.max(0, Math.min(scene.height, current.origin.y + direction[1])),
                },
              }
        )
      }}
    >
      <svg
        width={scene.width * grid}
        height={scene.height * grid}
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{ width: '100%', height: '100%' }}
        aria-hidden="true"
      >
        {placement && shape && (
          <g
            data-testid="spell-area-preview"
            data-origin-x={placement.origin.x}
            data-origin-y={placement.origin.y}
            data-angle={placement.angle}
          >
            {type === 'sphere' ? (
              <circle
                cx={placement.origin.x * grid}
                cy={placement.origin.y * grid}
                r={shape.radius * grid}
                fill="var(--accent)"
                fillOpacity={0.2}
                stroke="var(--accent)"
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
              />
            ) : (
              <polygon
                points={shape.points.map((p) => p.x * grid + ',' + p.y * grid).join(' ')}
                fill="var(--accent)"
                fillOpacity={0.2}
                stroke="var(--accent)"
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
              />
            )}
            {type !== 'sphere' && (
              <line
                x1={placement.origin.x * grid}
                y1={placement.origin.y * grid}
                x2={shape.tip.x * grid}
                y2={shape.tip.y * grid}
                stroke="var(--accent)"
                strokeDasharray="6 4"
                vectorEffect="non-scaling-stroke"
              />
            )}
            <circle
              cx={placement.origin.x * grid}
              cy={placement.origin.y * grid}
              r={5 * textScale}
              fill="var(--bg-app)"
              stroke="var(--accent)"
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
            />
            <text
              x={shape.label.x * grid}
              y={shape.label.y * grid - 12 * textScale}
              textAnchor="middle"
              fill="var(--text-primary)"
              fontSize={13 * textScale}
              fontWeight="bold"
              style={{ paintOrder: 'stroke', stroke: 'var(--bg-app)', strokeWidth: 4 * textScale }}
            >
              {t(
                type === 'sphere'
                  ? 'areas.radiusValue'
                  : type === 'cube'
                    ? 'areas.sideValue'
                    : type === 'line'
                      ? 'areas.lineValue'
                      : 'areas.lengthValue',
                { feet: size, width: lineWidth }
              )}
            </text>
          </g>
        )}
      </svg>
    </div>
  )
}
