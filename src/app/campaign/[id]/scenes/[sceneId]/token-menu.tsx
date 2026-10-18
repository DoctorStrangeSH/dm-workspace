'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  X,
  Trash2,
  Eye,
  EyeOff,
  Minus,
  Plus,
  Heart,
} from 'lucide-react'
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

export default function TokenMenu({
  token,
  scene,
  isDm,
  currentUserId,
  onClose,
  onUpdate,
}: Props) {
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [hpInput, setHpInput] = useState('')

  const canEdit = isDm || token.owner_id === currentUserId

  const handleHP = (delta: number) => {
    if (token.hp_current === null) return
    const newHP = Math.max(0, token.hp_current + delta)
    startTransition(async () => {
      const res = await updateTokenHP(token.id, scene.id, newHP)
      if ('error' in res) toast.error(res.error ?? 'Ошибка')
      else onUpdate()
    })
  }

  const handleCustomHP = (sign: 1 | -1) => {
    const value = parseInt(hpInput, 10)
    if (isNaN(value) || value <= 0 || token.hp_current === null) return
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

  const handleToggleCondition = (cond: typeof CONDITION_LIST[0]) => {
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
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full border-2 flex items-center justify-center text-lg"
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
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* HP */}
          {token.hp_max !== null && token.hp_current !== null && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Heart size={14} className="text-red-400" />
                <span className="text-sm font-medium">HP</span>
                <span className="text-sm text-slate-400">
                  {token.hp_current} / {token.hp_max}
                </span>
              </div>

              <div className="h-2 bg-slate-950 rounded overflow-hidden mb-2">
                <div
                  className="h-full bg-red-500 transition-all"
                  style={{
                    width: `${(token.hp_current / token.hp_max) * 100}%`,
                  }}
                />
              </div>

              {canEdit && (
                <div className="space-y-2">
                  <div className="grid grid-cols-4 gap-1">
                    <button
                      onClick={() => handleHP(-5)}
                      disabled={isPending}
                      className="px-2 py-1.5 bg-red-950/40 border border-red-900/50 text-red-300 rounded text-xs hover:bg-red-950/60 transition disabled:opacity-50"
                    >
                      −5
                    </button>
                    <button
                      onClick={() => handleHP(-1)}
                      disabled={isPending}
                      className="px-2 py-1.5 bg-red-950/40 border border-red-900/50 text-red-300 rounded text-xs hover:bg-red-950/60 transition disabled:opacity-50"
                    >
                      −1
                    </button>
                    <button
                      onClick={() => handleHP(1)}
                      disabled={isPending}
                      className="px-2 py-1.5 bg-green-950/40 border border-green-900/50 text-green-300 rounded text-xs hover:bg-green-950/60 transition disabled:opacity-50"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => handleHP(5)}
                      disabled={isPending}
                      className="px-2 py-1.5 bg-green-950/40 border border-green-900/50 text-green-300 rounded text-xs hover:bg-green-950/60 transition disabled:opacity-50"
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
                      className="flex-1 px-2 py-1.5 bg-slate-950 border border-slate-800 rounded text-sm text-white"
                    />
                    <button
                      onClick={() => handleCustomHP(-1)}
                      disabled={isPending || !hpInput}
                      className="px-2 py-1.5 bg-red-950/40 border border-red-900/50 text-red-300 rounded text-xs transition disabled:opacity-50"
                    >
                      <Minus size={12} />
                    </button>
                    <button
                      onClick={() => handleCustomHP(1)}
                      disabled={isPending || !hpInput}
                      className="px-2 py-1.5 bg-green-950/40 border border-green-900/50 text-green-300 rounded text-xs transition disabled:opacity-50"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Условия */}
          {canEdit && (
            <div>
              <div className="text-sm font-medium mb-2">Состояния</div>
              <div className="grid grid-cols-2 gap-1">
                {CONDITION_LIST.map((cond) => {
                  const active = token.conditions.some(
                    (c) => c.name === cond.name
                  )
                  return (
                    <button
                      key={cond.name}
                      onClick={() => handleToggleCondition(cond)}
                      disabled={isPending}
                      className={cn(
                        'flex items-center gap-1.5 px-2 py-1.5 rounded text-xs text-left transition',
                        active
                          ? 'bg-amber-950/40 border border-amber-900/50 text-amber-300'
                          : 'bg-slate-950 border border-slate-800 text-slate-400 hover:border-slate-700'
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
            <div className="space-y-2 pt-3 border-t border-slate-800">
              <button
                onClick={handleToggleVisibility}
                disabled={isPending}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition',
                  token.is_hidden
                    ? 'bg-amber-950/40 border border-amber-900/50 text-amber-300'
                    : 'bg-slate-800 border border-slate-700 text-slate-300'
                )}
              >
                {token.is_hidden ? <EyeOff size={14} /> : <Eye size={14} />}
                {token.is_hidden ? 'Показать игрокам' : 'Скрыть от игроков'}
              </button>

              <button
                onClick={handleDelete}
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-950/40 border border-red-900/50 text-red-300 rounded text-sm hover:bg-red-950/60 transition disabled:opacity-50"
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