'use client'

import { useRef, useState, useEffect } from 'react'
import Image from 'next/image'
import { moveToken } from '@/lib/actions/tokens'
import { useToast } from '@/components/toast/toast-provider'
import { useT } from '@/lib/i18n'
import { isBlockedByWalls } from '@/lib/collision'
import { cn } from '@/lib/utils'
import type { Token as TokenType, SceneWall } from '@/lib/types'

interface Props {
  token: TokenType
  gridSize: number
  zoomScale?: number
  isActiveTurn?: boolean
  sceneId: string
  canDrag: boolean
  walls?: SceneWall[]
  onClick: () => void
}

export default function Token({ token, gridSize, zoomScale = 1, isActiveTurn = false, sceneId, canDrag, walls = [], onClick }: Props) {
  const t = useT()
  const toast = useToast()
  const [dragging, setDragging] = useState(false)
  const [pos, setPos] = useState({ x: token.x, y: token.y })
  const [blocked, setBlocked] = useState(false)
  const startRef = useRef({ x: 0, y: 0, tokenX: token.x, tokenY: token.y })
  const lastMovedAtRef = useRef(0)

  useEffect(() => {
    if (dragging) return
    const sinceMoved = Date.now() - lastMovedAtRef.current
    if (sinceMoved < 500) return
    setPos({ x: token.x, y: token.y })
  }, [token.x, token.y, dragging])

  const sizePx = gridSize * token.size
  const hpPercent =
    token.hp_current !== null && token.hp_max !== null && Number.isFinite(token.hp_current) && Number.isFinite(token.hp_max) && token.hp_current >= 0 && token.hp_max > 0
      ? Math.max(0, Math.min(100, (token.hp_current / token.hp_max) * 100))
      : null

  const tokenRadius = token.size * 0.3

  // Pointer Events support mouse, touch and stylus with the same drag rules.
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canDrag || !e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return
    e.preventDefault()
    e.stopPropagation()

    setDragging(true)
    startRef.current = { x: e.clientX, y: e.clientY, tokenX: pos.x, tokenY: pos.y }
    const activePointerId = e.pointerId

    const cleanup = () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerCancel)
      setDragging(false)
    }

    const handlePointerMove = (ev: PointerEvent) => {
      if (ev.pointerId !== activePointerId) return
      const dx = ev.clientX - startRef.current.x
      const dy = ev.clientY - startRef.current.y
      const newX = Math.max(0, startRef.current.tokenX + dx / (gridSize * zoomScale))
      const newY = Math.max(0, startRef.current.tokenY + dy / (gridSize * zoomScale))
      setPos({ x: Math.round(newX), y: Math.round(newY) })
    }

    const handlePointerCancel = (ev: PointerEvent) => {
      if (ev.pointerId !== activePointerId) return
      cleanup()
      setPos({ x: token.x, y: token.y })
      setBlocked(false)
    }

    const handlePointerUp = async (ev: PointerEvent) => {
      if (ev.pointerId !== activePointerId) return
      cleanup()
      setBlocked(false)

      const dx = ev.clientX - startRef.current.x
      const dy = ev.clientY - startRef.current.y
      if (Math.abs(dx) < 5 && Math.abs(dy) < 5) {
        onClick()
        return
      }

      const newX = Math.max(0, Math.round(startRef.current.tokenX + dx / (gridSize * zoomScale)))
      const newY = Math.max(0, Math.round(startRef.current.tokenY + dy / (gridSize * zoomScale)))

      if (walls.length > 0 && isBlockedByWalls(
        { x: token.x, y: token.y },
        { x: newX, y: newY },
        tokenRadius,
        walls
      )) {
        setPos({ x: token.x, y: token.y })
        setBlocked(true)
        toast.error(t('scenes.walls.blocked'))
        setTimeout(() => setBlocked(false), 600)
        return
      }

      setPos({ x: newX, y: newY })
      lastMovedAtRef.current = Date.now()
      const res = await moveToken(token.id, sceneId, newX, newY)
      if ('error' in res) {
        toast.error(res.error ?? t('common.error'))
        setPos({ x: token.x, y: token.y })
      }
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerCancel)
  }

  const conditions = Array.isArray(token.conditions) ? token.conditions : []

  return (
    <div
      className={cn(
        'absolute rounded-full border-2 select-none',
        canDrag && 'cursor-grab active:cursor-grabbing',
        dragging && 'z-50 shadow-[var(--shadow-xl)]',
        token.is_hidden && 'opacity-40',
        blocked && 'ring-2 ring-[var(--danger)]',
        hpPercent === 0 && !isActiveTurn && 'ring-2 ring-[var(--danger)]/60',
        isActiveTurn && 'z-20 ring-[3px] ring-[var(--accent)]',
        !dragging && 'transition-[left,top] duration-200'
      )}
      style={{
        left: pos.x * gridSize,
        top: pos.y * gridSize,
        width: sizePx,
        height: sizePx,
        borderColor: token.color,
        backgroundColor: `${token.color}33`,
        touchAction: canDrag ? 'none' : 'auto',
      }}
      onPointerDown={handlePointerDown}
      onClick={!canDrag ? onClick : undefined}
    >
      {isActiveTurn && <div aria-hidden="true" className="pointer-events-none absolute -inset-2 rounded-full border-2 border-[var(--accent)]/65 motion-safe:animate-pulse" />}
      {token.image_url ? (
        <Image
          src={token.image_url}
          alt={token.name}
          fill
          sizes="64px"
          className="pointer-events-none rounded-full object-cover"
          unoptimized
          draggable={false}
        />
      ) : (
        <div className="pointer-events-none flex h-full w-full items-center justify-center text-2xl">
          ⚔️
        </div>
      )}

      {hpPercent !== null && (
        <div className="pointer-events-none absolute right-0 -bottom-2 left-0 h-1.5 overflow-hidden rounded-full bg-[var(--bg-app)]" role="img" aria-label={`HP ${token.hp_current} / ${token.hp_max}`}>
          <div
            className={cn(
              'h-full transition-all',
              hpPercent > 50
                ? 'bg-[var(--success)]'
                : hpPercent > 25
                  ? 'bg-[var(--warning)]'
                  : 'bg-[var(--danger)]'
            )}
            style={{ width: `${hpPercent}%` }}
          />
        </div>
      )}

      <div className={cn("pointer-events-none absolute -bottom-7 left-1/2 flex max-w-40 -translate-x-1/2 items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] whitespace-nowrap shadow-[var(--shadow-sm)]", isActiveTurn ? "border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--text-primary)]" : "border-[var(--border-default)] bg-[var(--bg-surface)]/95 text-[var(--text-secondary)]")} data-turn-active={isActiveTurn}>
        <span className="max-w-24 truncate">{token.name}</span>
        {hpPercent !== null && <span className="shrink-0 font-semibold tabular-nums text-[var(--text-primary)]">{token.hp_current}/{token.hp_max}</span>}
      </div>

      {conditions.length > 0 && (
        <div className="pointer-events-none absolute -top-2 -right-2 flex gap-0.5">
          {conditions.slice(0, 3).map((c, i) => (
            <span
              key={i}
              className="flex h-4 w-4 items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] text-[8px]"
              title={c.name}
            >
              {c.icon ?? '●'}
            </span>
          ))}
          {conditions.length > 3 && <span className="flex h-4 min-w-5 items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] px-0.5 text-[9px] font-bold" title={conditions.slice(3).map(c => c.name).join(', ')}>+{conditions.length - 3}</span>}
        </div>
      )}
    </div>
  )
}
