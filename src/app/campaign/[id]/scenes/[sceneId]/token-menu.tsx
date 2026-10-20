'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Eye, EyeOff, Minus, Plus, Heart } from 'lucide-react'
import {
  updateTokenHP,
  toggleTokenVisibility,
  deleteToken,
  updateTokenConditions,
} from '@/lib/actions/tokens'
import { useToast } from '@/components/toast/toast-provider'
import { CONDITION_LIST } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Button, IconButton } from '@/components/ui'
import type { Scene, Token, TokenCondition } from '@/lib/types'

interface Props {
  token: Token
  scene: Scene
  isDm: boolean
  currentUserId: string | null
  onClose: () => void
  onUpdate: () => void
}

export default function TokenMenu({ token, scene, isDm, currentUserId, onClose, onUpdate }: Props) {
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [hpInput, setHpInput] = useState('')

  const [localHP, setLocalHP] = useState<number | null>(token.hp_current)

  const [prevHP, setPrevHP] = useState(token.hp_current)
  if (token.hp_current !== prevHP) {
    setPrevHP(token.hp_current)
    setLocalHP(token.hp_current)
  }

  const canEdit = isDm || token.owner_id === currentUserId

  const handleHP = (delta: number) => {
    if (localHP === null) return
    const newHP = Math.max(0, localHP + delta)
    setLocalHP(newHP)

    startTransition(async () => {
      const res = await updateTokenHP(token.id, scene.id, newHP)
      if ('error' in res) {
        toast.error(res.error ?? 'Ошибка')
        setLocalHP(token.hp_current)
      } else {
        onUpdate()
      }
    })
  }

  const handleCustomHP = (sign: 1 | -1) => {
    const value = parseInt(hpInput, 10)
    if (isNaN(value) || value <= 0 || localHP === null) return
    handleHP(sign * value)
    setHpInput('')
  }

  const handleToggleVisibility = () => {
    startTransition(async () => {
      const res = await toggleTokenVisibility(token.id, scene.id)
      if ('error' in res) toast.error(res.error ?? 'Ошибка')
      else onUpdate()
    })
  }

  const handleDelete = () => {
    if (!confirm(`Удалить токен «${token.name}»?`)) return
    startTransition(async () => {
      const res = await deleteToken(token.id, scene.id)
      if ('error' in res) toast.error(res.error ?? 'Ошибка')
      else {
        toast.success('Токен удалён')
        router.refresh()
        onClose()
      }
    })
  }

  const handleToggleCondition = (cond: (typeof CONDITION_LIST)[0]) => {
    const existing = token.conditions.find((c) => c.name === cond.name)
    const newConditions: TokenCondition[] = existing
      ? token.conditions.filter((c) => c.name !== cond.name)
      : [...token.conditions, { name: cond.name, icon: cond.icon }]

    startTransition(async () => {
      const res = await updateTokenConditions(token.id, scene.id, newConditions)
      if ('error' in res) toast.error(res.error ?? 'Ошибка')
      else onUpdate()
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-overlay)] p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-md flex-col rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-default)] p-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full border-2 text-lg"
              style={{ borderColor: token.color, backgroundColor: `${token.color}33` }}
            >
              ⚔️
            </div>
            <div>
              <h2 className="font-semibold text-[var(--text-primary)]">{token.name}</h2>
              <p className="text-xs text-[var(--text-muted)]">
                Размер: {token.size}×{token.size}
              </p>
            </div>
          </div>
          <IconButton variant="ghost" size="sm" label="Закрыть" onClick={onClose}>
            {/* X заменён на иконку внутри IconButton — но у нас X не импортирован в новой версии.
                Возвращаем X через lucide. */}
            <span className="text-lg leading-none">✕</span>
          </IconButton>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {/* HP */}
          {token.hp_max !== null && localHP !== null && (
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Heart size={14} className="text-[var(--danger)]" />
                <span className="text-sm font-medium text-[var(--text-primary)]">HP</span>
                <span className="text-sm text-[var(--text-muted)]">
                  {localHP} / {token.hp_max}
                </span>
              </div>

              <div className="mb-2 h-2 overflow-hidden rounded bg-[var(--bg-app)]">
                <div
                  className={cn(
                    'h-full transition-all',
                    (localHP / token.hp_max) * 100 > 50
                      ? 'bg-[var(--success)]'
                      : (localHP / token.hp_max) * 100 > 25
                        ? 'bg-[var(--warning)]'
                        : 'bg-[var(--danger)]'
                  )}
                  style={{ width: `${(localHP / token.hp_max) * 100}%` }}
                />
              </div>

              {canEdit && (
                <div className="space-y-2">
                  <div className="grid grid-cols-4 gap-1">
                    {[-5, -1, +1, +5].map((delta) => (
                      <Button
                        key={delta}
                        variant={delta < 0 ? 'danger' : 'primary'}
                        size="sm"
                        onClick={() => handleHP(delta)}
                        disabled={isPending}
                        className="text-xs"
                      >
                        {delta > 0 ? '+' : ''}
                        {delta}
                      </Button>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      value={hpInput}
                      onChange={(e) => setHpInput(e.target.value)}
                      placeholder="N"
                      min={1}
                      className="flex-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] px-2 py-1.5 text-sm text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none"
                    />
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleCustomHP(-1)}
                      disabled={isPending || !hpInput}
                      icon={<Minus size={12} />}
                      aria-label="Вычесть"
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleCustomHP(1)}
                      disabled={isPending || !hpInput}
                      icon={<Plus size={12} />}
                      aria-label="Прибавить"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Условия */}
          {canEdit && (
            <div>
              <div className="mb-2 text-sm font-medium text-[var(--text-primary)]">Состояния</div>
              <div className="grid grid-cols-2 gap-1">
                {CONDITION_LIST.map((cond) => {
                  const active = token.conditions.some((c) => c.name === cond.name)
                  return (
                    <button
                      key={cond.name}
                      onClick={() => handleToggleCondition(cond)}
                      disabled={isPending}
                      className={cn(
                        'flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-xs transition-colors',
                        active
                          ? 'border border-[var(--warning)]/30 bg-[var(--warning-subtle)] text-[var(--warning-text)]'
                          : 'border border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--text-muted)] hover:border-[var(--border-hover)]'
                      )}
                    >
                      <span>{cond.icon}</span>
                      <span className="truncate">{cond.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Действия ГМ */}
          {isDm && (
            <div className="space-y-2 border-t border-[var(--border-default)] pt-3">
              <Button
                variant="secondary"
                size="md"
                onClick={handleToggleVisibility}
                disabled={isPending}
                icon={token.is_hidden ? <EyeOff size={14} /> : <Eye size={14} />}
                className="w-full justify-start"
              >
                {token.is_hidden ? 'Показать игрокам' : 'Скрыть от игроков'}
              </Button>

              <Button
                variant="danger"
                size="md"
                onClick={handleDelete}
                disabled={isPending}
                icon={<Trash2 size={14} />}
                className="w-full"
              >
                Удалить токен
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
