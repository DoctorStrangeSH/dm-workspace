'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Minus, Plus } from 'lucide-react'
import { useSpellSlot } from '@/lib/actions/characters'
import { useToast } from '@/components/toast/toast-provider'
import { cn } from '@/lib/utils'
import type { SpellSlots } from '@/lib/types'

interface Props {
  characterId: string
  campaignId: string
  slots: SpellSlots
  canEdit: boolean
}

const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9]

export default function SpellSlotsTracker({
  characterId,
  campaignId,
  slots,
  canEdit,
}: Props) {
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()

  const activeLevels = LEVELS.filter((lvl) => slots[lvl] && slots[lvl].max > 0)

  if (activeLevels.length === 0) return null

  const handleAction = (level: number, action: 'use' | 'restore') => {
    startTransition(async () => {
      const res = await useSpellSlot(characterId, campaignId, level, action)
      if ('error' in res) {
        toast.error(res.error ?? 'Ошибка')
      } else {
        router.refresh()
      }
    })
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-4">
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
        Ячейки заклинаний
      </h3>

      <div className="space-y-2">
        {activeLevels.map((level) => {
          const slot = slots[level]
          return (
            <div key={level} className="flex items-center gap-3">
              <div className="w-16 text-sm text-slate-400">
                {level} ур.
              </div>

              <div className="flex-1 flex items-center gap-1">
                {Array.from({ length: slot.max }, (_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'w-6 h-6 rounded border-2 transition',
                      i < slot.current
                        ? 'bg-violet-600 border-violet-500'
                        : 'border-slate-700'
                    )}
                  />
                ))}
              </div>

              <div className="text-sm text-slate-400 tabular-nums w-12 text-right">
                {slot.current}/{slot.max}
              </div>

              {canEdit && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleAction(level, 'use')}
                    disabled={isPending || slot.current === 0}
                    className="p-1 hover:bg-slate-800 rounded transition disabled:opacity-30"
                    title="Потратить ячейку"
                  >
                    <Minus size={12} />
                  </button>
                  <button
                    onClick={() => handleAction(level, 'restore')}
                    disabled={isPending || slot.current === slot.max}
                    className="p-1 hover:bg-slate-800 rounded transition disabled:opacity-30"
                    title="Восстановить ячейку"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}