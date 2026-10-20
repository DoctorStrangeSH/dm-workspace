'use client'

import { useState, useTransition } from 'react'
import { Heart, Minus, Plus, Skull } from 'lucide-react'
import { updateCharacterHP } from '@/lib/actions/characters'
import { useToast } from '@/components/toast/toast-provider'
import { cn } from '@/lib/utils'
import type { CharacterHP } from '@/lib/types'

interface Props {
  characterId: string
  campaignId: string
  hp: CharacterHP
  canEdit: boolean
}

export default function HPTracker({ characterId, campaignId, hp, canEdit }: Props) {
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [customValue, setCustomValue] = useState('')

  const percent = hp.max > 0 ? (hp.current / hp.max) * 100 : 0
  const isLow = percent <= 25 && hp.current > 0
  const isDead = hp.current === 0

  const updateHP = (newHP: { current?: number; max?: number; temp?: number }) => {
    startTransition(async () => {
      const res = await updateCharacterHP(characterId, campaignId, newHP)
      if ('error' in res) {
        toast.error(res.error ?? 'Ошибка')
      }
    })
  }

  const applyCustom = (sign: 1 | -1) => {
    const value = parseInt(customValue, 10)
    if (isNaN(value) || value <= 0) return

    const newCurrent = Math.max(0, Math.min(hp.max, hp.current + sign * value))
    updateHP({ current: newCurrent })
    setCustomValue('')
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart
            size={16}
            className={cn(isDead ? 'text-red-500' : isLow ? 'text-red-400' : 'text-red-400')}
          />
          <span className="text-sm font-medium text-slate-300">HP</span>
        </div>

        {hp.temp > 0 && (
          <div className="flex items-center gap-1 text-xs text-blue-400">
            <span>+{hp.temp} temp</span>
          </div>
        )}
      </div>

      {/* Полоска HP */}
      <div className="relative mb-3 h-6 overflow-hidden rounded border border-slate-800 bg-slate-950">
        <div
          className={cn(
            'h-full transition-all duration-300',
            isDead ? 'bg-red-700' : isLow ? 'bg-red-500' : 'bg-red-600'
          )}
          style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
          {hp.current} / {hp.max}
        </div>
      </div>

      {isDead && (
        <div className="mb-3 flex items-center gap-2 rounded border border-red-900/50 bg-red-950/30 p-2 text-xs text-red-400">
          <Skull size={12} />
          <span>Спасброски от смерти: 3 успеха / 3 провала</span>
        </div>
      )}

      {/* Кнопки (только если можно редактировать) */}
      {canEdit && (
        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-1">
            <button
              type="button"
              onClick={() => updateHP({ current: Math.max(0, hp.current - 5) })}
              disabled={isPending || hp.current === 0}
              className="rounded border border-red-900/50 bg-red-950/40 px-2 py-1.5 text-xs text-red-300 transition hover:bg-red-950/60 disabled:opacity-40"
            >
              −5
            </button>
            <button
              type="button"
              onClick={() => updateHP({ current: Math.max(0, hp.current - 1) })}
              disabled={isPending || hp.current === 0}
              className="rounded border border-red-900/50 bg-red-950/40 px-2 py-1.5 text-xs text-red-300 transition hover:bg-red-950/60 disabled:opacity-40"
            >
              −1
            </button>
            <button
              type="button"
              onClick={() => updateHP({ current: Math.min(hp.max, hp.current + 1) })}
              disabled={isPending || hp.current === hp.max}
              className="rounded border border-green-900/50 bg-green-950/40 px-2 py-1.5 text-xs text-green-300 transition hover:bg-green-950/60 disabled:opacity-40"
            >
              +1
            </button>
            <button
              type="button"
              onClick={() => updateHP({ current: Math.min(hp.max, hp.current + 5) })}
              disabled={isPending || hp.current === hp.max}
              className="rounded border border-green-900/50 bg-green-950/40 px-2 py-1.5 text-xs text-green-300 transition hover:bg-green-950/60 disabled:opacity-40"
            >
              +5
            </button>
          </div>

          <div className="flex gap-1">
            <input
              type="number"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              placeholder="N"
              min={1}
              className="flex-1 rounded border border-slate-800 bg-slate-950 px-2 py-1.5 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => applyCustom(-1)}
              disabled={isPending || !customValue}
              className="rounded border border-red-900/50 bg-red-950/40 px-2 py-1.5 text-xs text-red-300 transition hover:bg-red-950/60 disabled:opacity-40"
            >
              <Minus size={12} />
            </button>
            <button
              type="button"
              onClick={() => applyCustom(1)}
              disabled={isPending || !customValue}
              className="rounded border border-green-900/50 bg-green-950/40 px-2 py-1.5 text-xs text-green-300 transition hover:bg-green-950/60 disabled:opacity-40"
            >
              <Plus size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
