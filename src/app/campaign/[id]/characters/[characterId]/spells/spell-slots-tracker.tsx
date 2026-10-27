'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Minus, Plus, Sparkles } from 'lucide-react'
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

  const activeLevels = LEVELS.filter((lvl) => slots[lvl] && Number.isInteger(slots[lvl].max) && slots[lvl].max > 0 && slots[lvl].max <= 20)

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
    <section className="mb-5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-sm)] sm:p-5">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
        <Sparkles size={16} className="text-[var(--accent-text)]" aria-hidden="true" />
        {t('characters.spellSlots.title')}
      </h3>

      <div className="grid gap-3">
        {activeLevels.map((level) => {
          const slot = slots[level]
          return (
            <div key={level} className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-3 sm:gap-3">
              <div className="w-16 shrink-0 text-sm font-semibold text-[var(--text-secondary)]">
                {t('characters.spellSlots.level', { level })}
              </div>

              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5" role="img" aria-label={`${t('characters.spellSlots.level', { level })}: ${slot.current}/${slot.max}`}>
                {Array.from({ length: slot.max }, (_, i) => (
                  <div
                    key={i}
                    aria-hidden="true"
                    className={cn(
                      'h-5 w-5 rotate-45 rounded-[5px] border-2 transition-colors duration-200 motion-reduce:transition-none sm:h-6 sm:w-6',
                      i < slot.current
                        ? 'border-[var(--accent)] bg-[var(--accent)]'
                        : 'border-[var(--border-default)]'
                    )}
                  />
                ))}
              </div>

              <div className="w-14 text-right text-base font-semibold text-[var(--text-secondary)] tabular-nums">
                {slot.current}/{slot.max}
              </div>

              {canEdit && (
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => handleAction(level, 'use')}
                    disabled={isPending || slot.current === 0}
                    className="flex h-11 w-11 touch-manipulation items-center justify-center rounded-lg border border-[var(--border-default)] transition-colors hover:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] disabled:opacity-30" aria-label={`${t('characters.spellSlots.use')} — ${t('characters.spellSlots.level', { level })}`}
                    title={t('characters.spellSlots.use')}
                  >
                    <Minus size={18} />
                  </button>
                  <button
                    onClick={() => handleAction(level, 'restore')}
                    disabled={isPending || slot.current === slot.max}
                    className="flex h-11 w-11 touch-manipulation items-center justify-center rounded-lg border border-[var(--border-default)] transition-colors hover:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] disabled:opacity-30" aria-label={`${t('characters.spellSlots.restore')} — ${t('characters.spellSlots.level', { level })}`}
                    title={t('characters.spellSlots.restore')}
                  >
                    <Plus size={18} />
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
