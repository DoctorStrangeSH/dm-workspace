'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Dices, RotateCcw, Skull, Shield } from 'lucide-react'
import { rollDeathSave, resetDeathSaves } from '@/lib/actions/characters'
import { useToast } from '@/components/toast/toast-provider'
import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n'
import type { DeathSaves } from '@/lib/types'

interface Props {
  characterId: string
  campaignId: string
  deathSaves: DeathSaves
  canEdit: boolean
}

export default function DeathSavesTracker({ characterId, campaignId, deathSaves, canEdit }: Props) {
  const t = useT()
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()

  const isStabilized = deathSaves.stabilized
  const isDead = deathSaves.failures >= 3

  const handleRoll = () => {
    startTransition(async () => {
      const res = await rollDeathSave(characterId, campaignId)

      if ('error' in res) {
        toast.error(res.error ?? t('common.error'))
        return
      }

      const rollDesc = t('characters.deathSave.roll', { roll: res.roll })

      // CHANGES (К8): используем status, а не парсим message
      let message: string
      if (res.isNatural20) {
        message = t('characters.deathSave.result.natural20')
      } else if (res.isNatural1) {
        message = t('characters.deathSave.result.natural1')
      } else if (res.status === 'dead') {
        message = t('characters.deathSave.result.dead')
      } else if (res.status === 'stabilized') {
        message = t('characters.deathSave.result.stabilized')
      } else if (res.status === 'success') {
        message = t('characters.deathSave.result.success', {
          current: res.deathSaves.successes,
        })
      } else {
        message = t('characters.deathSave.result.fail', {
          current: res.deathSaves.failures,
        })
      }

      if (res.status === 'dead') {
        toast.error(message, { description: rollDesc })
      } else if (res.status === 'stabilized' || res.isNatural20) {
        toast.success(message, { description: rollDesc })
      } else {
        toast.info(message, { description: rollDesc })
      }

      router.refresh()
    })
  }

  const handleReset = () => {
    startTransition(async () => {
      const res = await resetDeathSaves(characterId, campaignId)

      if ('error' in res) {
        toast.error(res.error ?? t('common.error'))
        return
      }

      toast.success(t('characters.deathSave.reset'))
      router.refresh()
    })
  }

  return (
    <div
      className={cn(
        'rounded-xl border p-4',
        isDead
          ? 'border-[var(--danger)]/40 bg-[var(--danger-subtle)]'
          : isStabilized
            ? 'border-[var(--success)]/40 bg-[var(--success-subtle)]'
            : 'border-[var(--danger)]/30 bg-[var(--danger-subtle)]/50'
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isStabilized ? (
            <Shield size={16} className="text-[var(--success-text)]" />
          ) : (
            <Skull size={16} className="text-[var(--danger-text)]" />
          )}
          <span
            className={cn(
              'text-sm font-semibold',
              isDead
                ? 'text-[var(--danger-text)]'
                : isStabilized
                  ? 'text-[var(--success-text)]'
                  : 'text-[var(--danger-text)]'
            )}
          >
            {isDead
              ? t('characters.deathSave.dead')
              : isStabilized
                ? t('characters.deathSave.stabilized')
                : t('characters.deathSave.title')}
          </span>
        </div>

        {canEdit && !isDead && (
          <div className="flex items-center gap-1">
            <button
              onClick={handleRoll}
              disabled={isPending}
              className="flex items-center gap-1 rounded border border-[var(--danger)]/40 bg-[var(--danger-subtle)] px-2.5 py-1 text-xs text-[var(--danger-text)] transition hover:bg-[var(--danger-subtle)]/80 disabled:opacity-50"
              title={t('characters.deathSave.rollHint')}
            >
              <Dices size={12} />
              {t('characters.deathSave.rollButton')}
            </button>
            <button
              onClick={handleReset}
              disabled={isPending}
              className="rounded p-1 transition hover:bg-[var(--bg-hover)] disabled:opacity-50"
              title={t('characters.deathSave.resetButton')}
            >
              <RotateCcw size={12} className="text-[var(--text-muted)]" />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="mb-2 text-[10px] tracking-wider text-[var(--text-subtle)] uppercase">
            {t('characters.deathSave.successes')}
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full border-2 transition',
                  deathSaves.successes >= i
                    ? 'border-[var(--success)] bg-[var(--success)] text-white'
                    : 'border-[var(--border-default)]'
                )}
              >
                {deathSaves.successes >= i && <span className="text-xs">✓</span>}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 text-[10px] tracking-wider text-[var(--text-subtle)] uppercase">
            {t('characters.deathSave.failures')}
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full border-2 transition',
                  deathSaves.failures >= i
                    ? 'border-[var(--danger)] bg-[var(--danger)] text-white'
                    : 'border-[var(--border-default)]'
                )}
              >
                {deathSaves.failures >= i && <span className="text-xs">✗</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {isDead && (
        <p className="mt-3 text-xs text-[var(--danger-text)]">
          {t('characters.deathSave.deadHint')}
        </p>
      )}

      {isStabilized && (
        <p className="mt-3 text-xs text-[var(--success-text)]">
          {t('characters.deathSave.stabilizedHint')}
        </p>
      )}
    </div>
  )
}
