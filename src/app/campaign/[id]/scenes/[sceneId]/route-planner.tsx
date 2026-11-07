'use client'

import { useId, useRef, useState, type RefObject } from 'react'
import { Route, Undo2, Eraser, Crosshair, X } from 'lucide-react'
import { Button } from '@/components/ui'
import { useT } from '@/lib/i18n'
import { clientToGrid, type MapPoint } from '@/lib/maps/geometry'
import { MAX_ROUTE_POINTS, routeDistance, type RouteMetric } from '@/lib/maps/route'
import type { Scene } from '@/lib/types'

interface RouteProps {
  points: MapPoint[]
  metric: RouteMetric
  onUndo: () => void
  onClose: () => void
}

export function RouteControls({
  points,
  metric,
  squareGrid,
  onMetric,
  onLocate,
  onClear,
  onUndo,
  onClose,
}: RouteProps & {
  squareGrid: boolean
  onMetric: (metric: RouteMetric) => void
  onLocate: () => void
  onClear: () => void
}) {
  const t = useT()
  const distance = routeDistance(points, metric)
  return (
    <section
      aria-label={t('route.title')}
      className="border-b border-[var(--border-default)] bg-[var(--accent-subtle)] p-3 sm:p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
          <Route size={18} aria-hidden="true" />
          {t('route.title')}
        </h2>
        <Button
          variant="ghost"
          className="min-h-11 min-w-11 !px-2"
          aria-label={t('route.close')}
          onClick={onClose}
        >
          <X size={18} />
        </Button>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <div role="status" aria-live="polite" aria-atomic="true" className="min-w-0">
          <p className="text-2xl font-bold text-[var(--accent-text)] tabular-nums">
            {t('route.total', { feet: distance.feet })}
          </p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            {t('route.summary', { cells: distance.cells, count: Math.max(0, points.length - 1) })}
          </p>
          {points.length === MAX_ROUTE_POINTS && (
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              {t('route.limit', { count: MAX_ROUTE_POINTS })}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            className="min-h-11 text-xs"
            icon={<Crosshair size={16} />}
            onClick={onLocate}
          >
            {t('route.locate')}
          </Button>
          <Button
            variant="secondary"
            className="min-h-11 text-xs"
            icon={<Undo2 size={16} />}
            disabled={!points.length}
            onClick={onUndo}
          >
            {t('route.undo')}
          </Button>
          <Button
            variant="ghost"
            className="min-h-11 text-xs"
            icon={<Eraser size={16} />}
            disabled={!points.length}
            onClick={onClear}
          >
            {t('route.clear')}
          </Button>
        </div>
      </div>
      {squareGrid && (
        <div role="group" aria-label={t('route.metric')} className="mt-3 flex flex-wrap gap-2">
          {(['straight', 'grid'] as const).map((value) => (
            <Button
              key={value}
              variant={metric === value ? 'primary' : 'secondary'}
              className="min-h-11 text-xs"
              aria-pressed={metric === value}
              onClick={() => onMetric(value)}
            >
              {t('route.' + value)}
            </Button>
          ))}
        </div>
      )}
      <p className="mt-3 text-xs text-[var(--text-secondary)]">{t('route.hint')}</p>
      <p className="mt-1 text-xs text-[var(--text-muted)]">{t('route.private')}</p>
    </section>
  )
}

export function RouteLayer({
  scene,
  points,
  metric,
  cursor,
  onCursor,
  onKeyboardCursor,
  onAdd,
  onUndo,
  onClose,
  layerRef,
}: RouteProps & {
  scene: Scene
  cursor: MapPoint
  onCursor: (point: MapPoint) => void
  onKeyboardCursor: (point: MapPoint) => void
  onAdd: (point: MapPoint) => void
  layerRef: RefObject<HTMLDivElement | null>
}) {
  const t = useT()
  const hintId = useId()
  const pending = useRef<number | null>(null)
  const [pointing, setPointing] = useState(false)
  const size = scene.grid_size
  const toPoint = (event: React.PointerEvent) => {
    const point = clientToGrid(
      event,
      event.currentTarget.getBoundingClientRect(),
      scene.width,
      scene.height,
      'cell'
    )
    return { x: point.x + 0.5, y: point.y + 0.5 }
  }
  const distance = routeDistance(points, metric)
  return (
    <div
      ref={layerRef}
      data-testid="route-layer"
      tabIndex={0}
      role="group"
      aria-label={t('route.canvas')}
      aria-describedby={hintId}
      className="absolute inset-0 z-30 outline-offset-[-3px] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
      style={{ cursor: 'crosshair', touchAction: 'none' }}
      onPointerDown={(event) => {
        if (!event.isPrimary || event.button !== 0) return
        event.preventDefault()
        event.stopPropagation()
        event.currentTarget.focus({ preventScroll: true })
        event.currentTarget.setPointerCapture(event.pointerId)
        pending.current = event.pointerId
        onCursor(toPoint(event))
        setPointing(true)
      }}
      onPointerMove={(event) => {
        if (event.isPrimary && pending.current === event.pointerId) onCursor(toPoint(event))
      }}
      onPointerUp={(event) => {
        if (pending.current !== event.pointerId) return
        const point = toPoint(event)
        pending.current = null
        setPointing(false)
        onCursor(point)
        onAdd(point)
      }}
      onPointerCancel={() => {
        pending.current = null
        setPointing(false)
      }}
      onLostPointerCapture={() => {
        pending.current = null
        setPointing(false)
      }}
      onKeyDown={(event) => {
        if (document.querySelector('dialog[open], [role="dialog"][aria-modal="true"]')) return
        if (event.ctrlKey || event.metaKey || event.altKey) return
        const direction: Record<string, MapPoint> = {
          ArrowLeft: { x: -1, y: 0 },
          ArrowRight: { x: 1, y: 0 },
          ArrowUp: { x: 0, y: -1 },
          ArrowDown: { x: 0, y: 1 },
        }
        if (
          !direction[event.key] &&
          !['Enter', ' ', 'Backspace', 'Home', 'Escape'].includes(event.key)
        )
          return
        event.preventDefault()
        event.stopPropagation()
        if (direction[event.key])
          onKeyboardCursor({
            x: Math.max(0.5, Math.min(scene.width - 0.5, cursor.x + direction[event.key].x)),
            y: Math.max(0.5, Math.min(scene.height - 0.5, cursor.y + direction[event.key].y)),
          })
        else if (event.key === 'Enter' || event.key === ' ') {
          if (!event.repeat) onAdd(cursor)
        } else if (event.key === 'Backspace') onUndo()
        else if (event.key === 'Escape') onClose()
        else
          onKeyboardCursor({
            x: Math.floor(scene.width / 2) + 0.5,
            y: Math.floor(scene.height / 2) + 0.5,
          })
      }}
    >
      <span id={hintId} className="sr-only">
        {t('route.keyboard')}
      </span>
      <span role="status" aria-live="polite" className="sr-only">
        {t('route.cursor', { x: cursor.x + 0.5, y: cursor.y + 0.5 })}
      </span>
      <svg
        width={scene.width * size}
        height={scene.height * size}
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        {points.length > 1 && (
          <polyline
            data-testid="route-path"
            data-feet={distance.feet}
            points={points.map((p) => `${p.x * size},${p.y * size}`).join(' ')}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={3}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        )}
        {points.map((point, index) => (
          <g key={index}>
            <circle
              cx={point.x * size}
              cy={point.y * size}
              r={9}
              fill="var(--bg-app)"
              stroke="var(--accent)"
              strokeWidth={2}
            />
            <text
              x={point.x * size}
              y={point.y * size + 3}
              textAnchor="middle"
              fontSize={9}
              fontWeight="bold"
              fill="var(--text-primary)"
            >
              {index + 1}
            </text>
          </g>
        ))}
        <g
          data-testid="route-cursor"
          data-x={cursor.x}
          data-y={cursor.y}
          opacity={pointing ? 1 : 0.75}
        >
          <circle
            cx={cursor.x * size}
            cy={cursor.y * size}
            r={size * 0.35}
            fill="var(--accent-subtle)"
            stroke="var(--accent)"
            strokeWidth={2}
            strokeDasharray="4 3"
          />
          <path
            d={`M${cursor.x * size - 6} ${cursor.y * size}h12 M${cursor.x * size} ${cursor.y * size - 6}v12`}
            stroke="var(--accent)"
            strokeWidth={2}
          />
        </g>
      </svg>
    </div>
  )
}
