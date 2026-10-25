'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Minus, Plus } from 'lucide-react'
import { spendSpellSlot } from '@/lib/actions/characters'
import { useToast } from '@/components/toast/toast-provider'
import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n'
import type { SpellSlots } from '@/lib/types'

interface Props {
  characterId: string
  campaignId: string
  slots: SpellSlots
  canEdit: boolean
}

const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9]

export default function SpellSlotsTracker({ characterId, campaignId, slots, canEdit }: Props) {
  const t = useT()
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()

  const activeLevels = LEVELS.filter((lvl) => slots[lvl] && slots[lvl].max > 0)

  if (activeLevels.length === 0) return null

  const handleAction = (level: number, action: 'use' | 'restore') => {
    startTransition(async () => {
      const res = await spendSpellSlot(characterId, campaignId, level, action)
      if ('error' in res) {
        toast.error(res.error ?? t('common.error'))
      } else {
        router.refresh()
      }
    })
  }

  return (
    <div className="mb-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
      <h3 className="mb-3 text-sm font-semibold tracking-wider text-[var(--text-muted)] uppercase">
        {t('characters.spellSlots.title')}
      </h3>

      <div className="space-y-2">
        {activeLevels.map((level) => {
          const slot = slots[level]
          return (
            <div key={level} className="flex items-center gap-3">
              <div className="w-16 text-sm text-[var(--text-muted)]">
                {t('characters.spellSlots.level', { level })}
              </div>

              <div className="flex flex-1 items-center gap-1">
                {Array.from({ length: slot.max }, (_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-6 w-6 rounded border-2 transition',
                      i < slot.current
                        ? 'border-[var(--accent)] bg-[var(--accent)]'
                        : 'border-[var(--border-default)]'
                    )}
                  />
                ))}
              </div>

              <div className="w-12 text-right text-sm text-[var(--text-muted)] tabular-nums">
                {slot.current}/{slot.max}
              </div>

              {canEdit && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleAction(level, 'use')}
                    disabled={isPending || slot.current === 0}
                    className="rounded p-1 transition hover:bg-[var(--bg-hover)] disabled:opacity-30"
                    title={t('characters.spellSlots.use')}
                  >
                    <Minus size={12} />
                  </button>
                  <button
                    onClick={() => handleAction(level, 'restore')}
                    disabled={isPending || slot.current === slot.max}
                    className="rounded p-1 transition hover:bg-[var(--bg-hover)] disabled:opacity-30"
                    title={t('characters.spellSlots.restore')}
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
