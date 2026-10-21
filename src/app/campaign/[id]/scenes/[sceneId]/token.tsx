'use client'

import { useRef, useState, useEffect } from 'react'
import { moveToken } from '@/lib/actions/tokens'
import { useToast } from '@/components/toast/toast-provider'
import { cn } from '@/lib/utils'
import type { Token as TokenType } from '@/lib/types'

interface Props {
  token: TokenType
  gridSize: number
  sceneId: string
  canDrag: boolean
  onClick: () => void
}

export default function Token({ token, gridSize, sceneId, canDrag, onClick }: Props) {
  const toast = useToast()
  const [dragging, setDragging] = useState(false)
  const [pos, setPos] = useState({ x: token.x, y: token.y })
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
    token.hp_current !== null && token.hp_max !== null && token.hp_max > 0
      ? (token.hp_current / token.hp_max) * 100
      : null

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!canDrag) return
    e.preventDefault()
    e.stopPropagation()

    setDragging(true)
    startRef.current = { x: e.clientX, y: e.clientY, tokenX: pos.x, tokenY: pos.y }

    const handleMouseMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startRef.current.x
      const dy = ev.clientY - startRef.current.y
      const newX = Math.max(0, startRef.current.tokenX + dx / gridSize)
      const newY = Math.max(0, startRef.current.tokenY + dy / gridSize)
      setPos({ x: Math.round(newX), y: Math.round(newY) })
    }

    const handleMouseUp = async (ev: MouseEvent) => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      setDragging(false)

      const dx = ev.clientX - startRef.current.x
      const dy = ev.clientY - startRef.current.y

      if (Math.abs(dx) < 5 && Math.abs(dy) < 5) {
        onClick()
        return
      }

      const newX = Math.max(0, Math.round(startRef.current.tokenX + dx / gridSize))
      const newY = Math.max(0, Math.round(startRef.current.tokenY + dy / gridSize))

      setPos({ x: newX, y: newY })
      lastMovedAtRef.current = Date.now()

      const res = await moveToken(token.id, sceneId, newX, newY)
      if ('error' in res) {
        toast.error(res.error ?? 'Ошибка')
        setPos({ x: token.x, y: token.y })
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  return (
    <div
      className={cn(
        'absolute rounded-full border-2 select-none',
        canDrag && 'cursor-grab active:cursor-grabbing',
        dragging && 'z-50 shadow-[var(--shadow-xl)]',
        token.is_hidden && 'opacity-40',
        !dragging && 'transition-[left,top] duration-200'
      )}
      style={{
        left: pos.x * gridSize,
        top: pos.y * gridSize,
        width: sizePx,
        height: sizePx,
        borderColor: token.color,
        backgroundColor: `${token.color}33`,
      }}
      onMouseDown={handleMouseDown}
    >
      {token.image_url ? (
        <img
          src={token.image_url}
          alt={token.name}
          className="pointer-events-none h-full w-full rounded-full object-cover"
          draggable={false}
        />
      ) : (
        <div className="pointer-events-none flex h-full w-full items-center justify-center text-2xl">
          ⚔️
        </div>
      )}

      {hpPercent !== null && (
        <div className="pointer-events-none absolute right-0 -bottom-1 left-0 h-1 overflow-hidden rounded bg-[var(--bg-app)]">
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

      <div className="pointer-events-none absolute -bottom-5 left-1/2 -translate-x-1/2 rounded bg-[var(--bg-app)]/80 px-1.5 py-0.5 text-[10px] whitespace-nowrap text-[var(--text-secondary)]">
        {token.name}
      </div>

      {token.conditions.length > 0 && (
        <div className="pointer-events-none absolute -top-2 -right-2 flex gap-0.5">
          {token.conditions.slice(0, 3).map((c, i) => (
            <span
              key={i}
              className="flex h-4 w-4 items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] text-[8px]"
              title={c.name}
            >
              {c.icon ?? '●'}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
