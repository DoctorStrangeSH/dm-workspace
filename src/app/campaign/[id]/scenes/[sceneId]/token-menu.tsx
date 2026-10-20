'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { X, Trash2, Eye, EyeOff, Minus, Plus, Heart } from 'lucide-react'
import {
  updateTokenHP,
  toggleTokenVisibility,
  deleteToken,
  updateTokenConditions,
} from '@/lib/actions/tokens'
import { useToast } from '@/components/toast/toast-provider'
import { CONDITION_LIST } from '@/lib/types'
import { cn } from '@/lib/utils'
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

  // CHANGES: убран useEffect(setLocalHP) → паттерн «props → state».
  // Синхронизация с сервером происходит только когда token.hp_current реально меняется
  // (после router.refresh()), не откатывая оптимистичное обновление.
  const [prevHP, setPrevHP] = useState(token.hp_current)
  if (token.hp_current !== prevHP) {
    setPrevHP(token.hp_current)
    setLocalHP(token.hp_current)
  }

  const canEdit = isDm || token.owner_id === currentUserId

  const handleHP = (delta: number) => {
    if (localHP === null) return
    const newHP = Math.max(0, localHP + delta)
    setLocalHP(newHP) // оптимистично

    startTransition(async () => {
      const res = await updateTokenHP(token.id, scene.id, newHP)
      if ('error' in res) {
        toast.error(res.error ?? 'Ошибка')
        setLocalHP(token.hp_current) // откат
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-md flex-col rounded-2xl border border-slate-800 bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full border-2 text-lg"
              style={{
                borderColor: token.color,
                backgroundColor: `${token.color}33`,
              }}
            >
              ⚔️
            </div>
            <div>
              <h2 className="font-semibold">{token.name}</h2>
              <p className="text-xs text-slate-500">
                Размер: {token.size}×{token.size}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded p-1 hover:bg-slate-800">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {token.hp_max !== null && localHP !== null && (
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Heart size={14} className="text-red-400" />
                <span className="text-sm font-medium">HP</span>
                <span className="text-sm text-slate-400">
                  {localHP} / {token.hp_max}
                </span>
              </div>

              <div className="mb-2 h-2 overflow-hidden rounded bg-slate-950">
                <div
                  className="h-full bg-red-500 transition-all"
                  style={{ width: `${(localHP / token.hp_max) * 100}%` }}
                />
              </div>

              {canEdit && (
                <div className="space-y-2">
                  <div className="grid grid-cols-4 gap-1">
                    <button
                      onClick={() => handleHP(-5)}
                      disabled={isPending}
                      className="rounded border border-red-900/50 bg-red-950/40 px-2 py-1.5 text-xs text-red-300 transition hover:bg-red-950/60 disabled:opacity-50"
                    >
                      −5
                    </button>
                    <button
                      onClick={() => handleHP(-1)}
                      disabled={isPending}
                      className="rounded border border-red-900/50 bg-red-950/40 px-2 py-1.5 text-xs text-red-300 transition hover:bg-red-950/60 disabled:opacity-50"
                    >
                      −1
                    </button>
                    <button
                      onClick={() => handleHP(1)}
                      disabled={isPending}
                      className="rounded border border-green-900/50 bg-green-950/40 px-2 py-1.5 text-xs text-green-300 transition hover:bg-green-950/60 disabled:opacity-50"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => handleHP(5)}
                      disabled={isPending}
                      className="rounded border border-green-900/50 bg-green-950/40 px-2 py-1.5 text-xs text-green-300 transition hover:bg-green-950/60 disabled:opacity-50"
                    >
                      +5
                    </button>
                  </div>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      value={hpInput}
                      onChange={(e) => setHpInput(e.target.value)}
                      placeholder="N"
                      min={1}
                      className="flex-1 rounded border border-slate-800 bg-slate-950 px-2 py-1.5 text-sm text-white"
                    />
                    <button
                      onClick={() => handleCustomHP(-1)}
                      disabled={isPending || !hpInput}
                      className="rounded border border-red-900/50 bg-red-950/40 px-2 py-1.5 text-xs text-red-300 transition disabled:opacity-50"
                    >
                      <Minus size={12} />
                    </button>
                    <button
                      onClick={() => handleCustomHP(1)}
                      disabled={isPending || !hpInput}
                      className="rounded border border-green-900/50 bg-green-950/40 px-2 py-1.5 text-xs text-green-300 transition disabled:opacity-50"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {canEdit && (
            <div>
              <div className="mb-2 text-sm font-medium">Состояния</div>
              <div className="grid grid-cols-2 gap-1">
                {CONDITION_LIST.map((cond) => {
                  const active = token.conditions.some((c) => c.name === cond.name)
                  return (
                    <button
                      key={cond.name}
                      onClick={() => handleToggleCondition(cond)}
                      disabled={isPending}
                      className={cn(
                        'flex items-center gap-1.5 rounded px-2 py-1.5 text-left text-xs transition',
                        active
                          ? 'border border-amber-900/50 bg-amber-950/40 text-amber-300'
                          : 'border border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
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

          {isDm && (
            <div className="space-y-2 border-t border-slate-800 pt-3">
              <button
                onClick={handleToggleVisibility}
                disabled={isPending}
                className={cn(
                  'flex w-full items-center gap-2 rounded px-3 py-2 text-sm transition',
                  token.is_hidden
                    ? 'border border-amber-900/50 bg-amber-950/40 text-amber-300'
                    : 'border border-slate-700 bg-slate-800 text-slate-300'
                )}
              >
                {token.is_hidden ? <EyeOff size={14} /> : <Eye size={14} />}
                {token.is_hidden ? 'Показать игрокам' : 'Скрыть от игроков'}
              </button>

              <button
                onClick={handleDelete}
                disabled={isPending}
                className="flex w-full items-center justify-center gap-2 rounded border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-300 transition hover:bg-red-950/60 disabled:opacity-50"
              >
                <Trash2 size={14} />
                Удалить токен
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
