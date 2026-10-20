'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Dices, RotateCcw, Skull, Shield } from 'lucide-react'
import { rollDeathSave, resetDeathSaves } from '@/lib/actions/characters'
import { useToast } from '@/components/toast/toast-provider'
import { cn } from '@/lib/utils'
import type { DeathSaves } from '@/lib/types'

interface Props {
  characterId: string
  campaignId: string
  deathSaves: DeathSaves
  canEdit: boolean
}

export default function DeathSavesTracker({ characterId, campaignId, deathSaves, canEdit }: Props) {
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()

  const isStabilized = deathSaves.stabilized
  const isDead = deathSaves.failures >= 3

  const handleRoll = () => {
    startTransition(async () => {
      const res = await rollDeathSave(characterId, campaignId)

      // Type guard
      if ('error' in res) {
        toast.error(res.error ?? 'Ошибка')
        return
      }

      if (res.message.includes('мёртв')) {
        toast.error(res.message, { description: `Бросок: ${res.roll}` })
      } else if (res.message.includes('стабилизирован')) {
        toast.success(res.message, { description: `Бросок: ${res.roll}` })
      } else if (res.message.includes('🎉')) {
        toast.success(res.message, { description: `Бросок: ${res.roll}` })
      } else {
        toast.info(res.message, { description: `Бросок: ${res.roll}` })
      }

      router.refresh()
    })
  }

  const handleReset = () => {
    startTransition(async () => {
      const res = await resetDeathSaves(characterId, campaignId)

      // Type guard
      if ('error' in res) {
        toast.error(res.error ?? 'Ошибка')
        return
      }

      toast.success('Спасброски сброшены')
      router.refresh()
    })
  }

  return (
    <div
      className={cn(
        'rounded-xl border bg-red-950/20 p-4',
        isDead
          ? 'border-red-800/60'
          : isStabilized
            ? 'border-green-800/60 bg-green-950/20'
            : 'border-red-900/40'
      )}
    >
      <div className="mb-3 flex items-center justify-between">
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
              isDead ? 'text-red-400' : isStabilized ? 'text-green-400' : 'text-red-300'
            )}
          >
            {isDead ? 'Мёртв' : isStabilized ? 'Стабилизирован' : 'Спасброски от смерти'}
          </span>
        </div>

        {canEdit && !isDead && (
          <div className="flex items-center gap-1">
            <button
              onClick={handleRoll}
              disabled={isPending}
              className="flex items-center gap-1 rounded border border-red-800/60 bg-red-900/40 px-2.5 py-1 text-xs text-red-200 transition hover:bg-red-900/60 disabled:opacity-50"
              title="Бросок 1d20"
            >
              <Dices size={12} />
              Бросок
            </button>
            <button
              onClick={handleReset}
              disabled={isPending}
              className="rounded p-1 transition hover:bg-slate-800 disabled:opacity-50"
              title="Сбросить"
            >
              <RotateCcw size={12} className="text-slate-400" />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="mb-2 text-[10px] tracking-wider text-slate-500 uppercase">Успехи</div>
          <div className="flex gap-1.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full border-2 transition',
                  deathSaves.successes >= i
                    ? 'border-green-500 bg-green-600 text-white'
                    : 'border-slate-700'
                )}
              >
                {deathSaves.successes >= i && <span className="text-xs">✓</span>}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 text-[10px] tracking-wider text-slate-500 uppercase">Провалы</div>
          <div className="flex gap-1.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full border-2 transition',
                  deathSaves.failures >= i
                    ? 'border-red-500 bg-red-600 text-white'
                    : 'border-slate-700'
                )}
              >
                {deathSaves.failures >= i && <span className="text-xs">✗</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {isDead && (
        <p className="mt-3 text-xs text-red-400">Персонаж мёртв. Обратись к ГМу для воскрешения.</p>
      )}

      {isStabilized && (
        <p className="mt-3 text-xs text-green-400">Стабилизирован — без сознания, но не умирает.</p>
      )}
    </div>
  )
}
