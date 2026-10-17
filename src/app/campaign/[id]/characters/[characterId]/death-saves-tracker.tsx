'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Dices, RotateCcw, Skull, Shield } from 'lucide-react'
import {
  rollDeathSave,
  resetDeathSaves,
} from '@/lib/actions/characters'
import { useToast } from '@/components/toast/toast-provider'
import { cn } from '@/lib/utils'
import type { DeathSaves } from '@/lib/types'

interface Props {
  characterId: string
  campaignId: string
  deathSaves: DeathSaves
  canEdit: boolean
}

export default function DeathSavesTracker({
  characterId,
  campaignId,
  deathSaves,
  canEdit,
}: Props) {
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()

  const isStabilized = deathSaves.stabilized
  const isDead = deathSaves.failures >= 3

  const handleRoll = () => {
    startTransition(async () => {
      const res = await rollDeathSave(characterId, campaignId)
      if (res.error) {
        toast.error(res.error)
        return
      }
      if (res.message) {
        if (res.message.includes('мёртв')) {
          toast.error(res.message, {
            description: `Бросок: ${res.roll}`,
          })
        } else if (res.message.includes('стабилизирован')) {
          toast.success(res.message, {
            description: `Бросок: ${res.roll}`,
          })
        } else if (res.message.includes('🎉')) {
          toast.success(res.message, {
            description: `Бросок: ${res.roll}`,
          })
        } else {
          toast.info(res.message, {
            description: `Бросок: ${res.roll}`,
          })
        }
      }
      router.refresh()
    })
  }

  const handleReset = () => {
    startTransition(async () => {
      const res = await resetDeathSaves(characterId, campaignId)
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success('Спасброски сброшены')
      router.refresh()
    })
  }

  return (
    <div
      className={cn(
        'bg-red-950/20 border rounded-xl p-4',
        isDead
          ? 'border-red-800/60'
          : isStabilized
            ? 'border-green-800/60 bg-green-950/20'
            : 'border-red-900/40'
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isDead ? (
            <Skull size={16} className="text-red-500" />
          ) : isStabilized ? (
            <Shield size={16} className="text-green-400" />
          ) : (
            <Skull size={16} className="text-red-400" />
          )}
          <span
            className={cn(
              'text-sm font-semibold',
              isDead
                ? 'text-red-400'
                : isStabilized
                  ? 'text-green-400'
                  : 'text-red-300'
            )}
          >
            {isDead
              ? 'Мёртв'
              : isStabilized
                ? 'Стабилизирован'
                : 'Спасброски от смерти'}
          </span>
        </div>

        {canEdit && !isDead && (
          <div className="flex items-center gap-1">
            <button
              onClick={handleRoll}
              disabled={isPending}
              className="flex items-center gap-1 px-2.5 py-1 text-xs bg-red-900/40 border border-red-800/60 text-red-200 rounded hover:bg-red-900/60 transition disabled:opacity-50"
              title="Бросок 1d20"
            >
              <Dices size={12} />
              Бросок
            </button>
            <button
              onClick={handleReset}
              disabled={isPending}
              className="p-1 hover:bg-slate-800 rounded transition disabled:opacity-50"
              title="Сбросить"
            >
              <RotateCcw size={12} className="text-slate-400" />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Успехи */}
        <div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">
            Успехи
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  'w-6 h-6 rounded-full border-2 flex items-center justify-center transition',
                  deathSaves.successes >= i
                    ? 'bg-green-600 border-green-500 text-white'
                    : 'border-slate-700'
                )}
              >
                {deathSaves.successes >= i && (
                  <span className="text-xs">✓</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Провалы */}
        <div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">
            Провалы
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  'w-6 h-6 rounded-full border-2 flex items-center justify-center transition',
                  deathSaves.failures >= i
                    ? 'bg-red-600 border-red-500 text-white'
                    : 'border-slate-700'
                )}
              >
                {deathSaves.failures >= i && (
                  <span className="text-xs">✗</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {isDead && (
        <p className="mt-3 text-xs text-red-400">
          Персонаж мёртв. Обратись к ГМу для воскрешения.
        </p>
      )}

      {isStabilized && (
        <p className="mt-3 text-xs text-green-400">
          Стабилизирован — без сознания, но не умирает.
        </p>
      )}
    </div>
  )
}