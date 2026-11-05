'use client'

import { useRef, useState } from 'react'
import { revealArea } from '@/lib/actions/fog'
import { useToast } from '@/components/toast/toast-provider'
import { useRealtimeFog } from '@/lib/hooks/use-realtime-fog'
import { useT } from '@/lib/i18n'
import { clientToGrid } from '@/lib/maps/geometry'
import type { Scene, FogArea } from '@/lib/types'

interface Props {
  scene: Scene
  initialFog: FogArea[]
  isDm: boolean
  fogEnabled: boolean
  brushMode: boolean
}

export default function FogLayer({ scene, initialFog, isDm, fogEnabled, brushMode }: Props) {
  const t = useT()
  const toast = useToast()
  const fog = useRealtimeFog({ sceneId: scene.id, initialFog })
  const [dragging, setDragging] = useState(false)
  const [start, setStart] = useState<{ x: number; y: number } | null>(null)
  const [end, setEnd] = useState<{ x: number; y: number } | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  if (!fogEnabled) return null

  const gridSize = scene.grid_size
  const width = scene.width * gridSize
  const height = scene.height * gridSize

  const revealedBoxes = fog.map((area) => ({
    x: area.x * gridSize,
    y: area.y * gridSize,
    width: area.width * gridSize,
    height: area.height * gridSize,
  }))

  const getGridCoords = (e: React.PointerEvent) => {
    if (!wrapperRef.current) return null
    return clientToGrid(
      e,
      wrapperRef.current.getBoundingClientRect(),
      scene.width,
      scene.height,
      'cell'
    )
  }

  const handleMouseDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDm || !brushMode) return
    if (!e.isPrimary || e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    const coords = getGridCoords(e)
    if (!coords) return
    setDragging(true)
    setStart(coords)
    setEnd(coords)
  }

  const handleMouseMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || !e.isPrimary) return
    const coords = getGridCoords(e)
    if (!coords) return
    setEnd(coords)
  }

  const handleMouseUp = async (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.isPrimary) return
    if (!dragging || !start || !end) {
      setDragging(false)
      return
    }
    const x = Math.min(start.x, end.x)
    const y = Math.min(start.y, end.y)
    const w = Math.abs(end.x - start.x) + 1
    const h = Math.abs(end.y - start.y) + 1
    setDragging(false)
    setStart(null)
    setEnd(null)
    if (w === 0 || h === 0) return
    try {
      const res = await revealArea(scene.id, x, y, w, h)
      if ('error' in res) toast.error(res.error ?? t('common.error'))
    } catch {
      toast.error(t('map.uncertain'))
    }
  }

  const preview =
    dragging && start && end
      ? {
          x: Math.min(start.x, end.x) * gridSize,
          y: Math.min(start.y, end.y) * gridSize,
          width: (Math.abs(end.x - start.x) + 1) * gridSize,
          height: (Math.abs(end.y - start.y) + 1) * gridSize,
        }
      : null

  // CHANGES (задача 3): pointer-events-none по умолчанию.
  // pointer-events-auto — ТОЛЬКО при brushMode && isDm,
  // иначе туман перекрывает токены и DM не может их двигать.
  const isInteractive = isDm && brushMode

  return (
    <div
      ref={wrapperRef}
      className={
        isInteractive
          ? 'pointer-events-auto absolute inset-0'
          : 'pointer-events-none absolute inset-0'
      }
      style={{
        cursor: isInteractive ? 'crosshair' : 'default',
        touchAction: isInteractive ? 'none' : 'auto',
      }}
      onPointerDown={handleMouseDown}
      onPointerMove={handleMouseMove}
      onPointerUp={handleMouseUp}
      onPointerCancel={() => {
        setDragging(false)
        setStart(null)
        setEnd(null)
      }}
    >
      <svg
        width={width}
        height={height}
        className="absolute inset-0"
        style={{ width: '100%', height: '100%' }}
      >
        <defs>
          <mask id={`fog-mask-${scene.id}`}>
            <rect width={width} height={height} fill="white" />
            {revealedBoxes.map((box, i) => (
              <rect
                key={i}
                x={box.x}
                y={box.y}
                width={box.width}
                height={box.height}
                fill="black"
              />
            ))}
            {preview && (
              <rect
                x={preview.x}
                y={preview.y}
                width={preview.width}
                height={preview.height}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width={width}
          height={height}
          fill="rgba(0, 0, 0, 0.85)"
          mask={`url(#fog-mask-${scene.id})`}
          style={{ pointerEvents: 'none' }}
        />
      </svg>
    </div>
  )
}
