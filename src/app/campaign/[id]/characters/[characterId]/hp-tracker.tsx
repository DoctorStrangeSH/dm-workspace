'use client'

import { useState, useTransition } from 'react'
import { Heart, Minus, Plus, Skull } from 'lucide-react'
import { updateCharacterHP } from '@/lib/actions/characters'
import { useToast } from '@/components/toast/toast-provider'
import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n'
import { Card, Button } from '@/components/ui'
import { readCharacterHP } from '@/lib/dnd/character-hp'

interface Props {
  characterId: string
  campaignId: string
  hp: unknown
  canEdit: boolean
}

export default function HPTracker({ characterId, campaignId, hp: rawHP, canEdit }: Props) {
  const t = useT()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [customValue, setCustomValue] = useState('')

  const hp = readCharacterHP(rawHP)
  if (!hp) {
    return (
      <Card padding="md">
        <p className="text-sm text-[var(--warning-text)]">{t('characters.hp.unavailable')}</p>
      </Card>
    )
  }

  const percent = hp.max > 0 ? (hp.current / hp.max) * 100 : 0
  const isLow = percent <= 25 && hp.current > 0
  const isDead = hp.current === 0

  const updateHP = (newHP: { current?: number; max?: number; temp?: number }) => {
    startTransition(async () => {
      const res = await updateCharacterHP(characterId, campaignId, newHP)
      if ('error' in res) {
        toast.error(res.error ?? t('common.error'))
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
    <Card padding="md">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart
            size={16}
            className={cn(
              isDead
                ? 'text-[var(--danger)]'
                : isLow
                  ? 'text-[var(--danger)]'
                  : 'text-[var(--danger)]'
            )}
          />
          <span className="text-sm font-medium text-[var(--text-secondary)]">HP</span>
        </div>

        {hp.temp > 0 && (
          <div className="flex items-center gap-1 text-xs text-[var(--info-text)]">
            <span>+{hp.temp} temp</span>
          </div>
        )}
      </div>

      <div className="relative mb-3 h-6 overflow-hidden rounded border border-[var(--border-default)] bg-[var(--bg-app)]">
        <div
          className={cn(
            'h-full transition-all duration-300',
            isDead ? 'bg-red-700' : isLow ? 'bg-[var(--danger)]' : 'bg-red-600'
          )}
          style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
          {hp.current} / {hp.max}
        </div>
      </div>

      {isDead && (
        <div className="mb-3 flex items-center gap-2 rounded border border-[var(--danger)]/30 bg-[var(--danger-subtle)] p-2 text-xs text-[var(--danger-text)]">
          <Skull size={12} />
          <span>{t('characters.deathSavesHint')}</span>
        </div>
      )}

      {canEdit && (
        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-2">
            <Button
              variant="danger"
              size="sm"
              onClick={() => updateHP({ current: Math.max(0, hp.current - 5) })}
              disabled={isPending || hp.current === 0}
            >
              −5
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => updateHP({ current: Math.max(0, hp.current - 1) })}
              disabled={isPending || hp.current === 0}
            >
              −1
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => updateHP({ current: Math.min(hp.max, hp.current + 1) })}
              disabled={isPending || hp.current === hp.max}
            >
              +1
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => updateHP({ current: Math.min(hp.max, hp.current + 5) })}
              disabled={isPending || hp.current === hp.max}
            >
              +5
            </Button>
          </div>

          <div className="flex gap-2">
            <input
              type="number"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              placeholder="N"
              min={1}
              className="min-h-12 min-w-0 flex-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] px-3 py-2 text-base text-[var(--text-primary)] placeholder:text-[var(--text-subtle)] focus:border-[var(--border-focus)] focus:outline-none"
            />
            <Button
              variant="danger"
              size="sm"
              onClick={() => applyCustom(-1)}
              disabled={isPending || !customValue}
              icon={<Minus size={12} />}
            />
            <Button
              variant="primary"
              size="sm"
              onClick={() => applyCustom(1)}
              disabled={isPending || !customValue}
              icon={<Plus size={12} />}
            />
          </div>
        </div>
      )}
    </Card>
  )
}
