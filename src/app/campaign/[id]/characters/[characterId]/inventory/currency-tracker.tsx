'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Coins } from 'lucide-react'
import { updateCurrency } from '@/lib/actions/characters'
import { useToast } from '@/components/toast/toast-provider'
import { useI18n } from '@/lib/i18n'
import { currencyShort } from '@/lib/i18n/labels'
import { cn } from '@/lib/utils'
import type { Currency } from '@/lib/types'

interface Props {
  characterId: string
  campaignId: string
  currency: Currency
  canEdit: boolean
}

const COLORS: Record<keyof Currency, string> = {
  pp: 'text-[var(--text-secondary)]',
  gp: 'text-[var(--warning-text)]',
  sp: 'text-[var(--text-muted)]',
  cp: 'text-[var(--danger-text)]',
}

const COIN_KEYS: (keyof Currency)[] = ['pp', 'gp', 'sp', 'cp']

export default function CurrencyTracker({ characterId, campaignId, currency, canEdit }: Props) {
  const { t, lang } = useI18n()
  const router = useRouter()
  const toast = useToast()
  const [, startTransition] = useTransition()
  const [editing, setEditing] = useState<keyof Currency | null>(null)
  const [tempValue, setTempValue] = useState('')

  const handleSave = (key: keyof Currency) => {
    const value = parseInt(tempValue, 10)
    if (isNaN(value) || value < 0) {
      toast.error(t('inventory.currency.invalidValue'))
      return
    }

    startTransition(async () => {
      const res = await updateCurrency(characterId, campaignId, {
        ...currency,
        [key]: value,
      })
      if ('error' in res) {
        toast.error(res.error ?? t('common.error'))
      } else {
        toast.success(t('inventory.currency.updated'))
        setEditing(null)
        setTempValue('')
        router.refresh()
      }
    })
  }

  return (
    <div className="mb-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
      <div className="mb-3 flex items-center gap-2">
        <Coins size={16} className="text-[var(--warning)]" />
        <h3 className="text-sm font-semibold tracking-wider text-[var(--text-muted)] uppercase">
          {t('inventory.currency.title')}
        </h3>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {COIN_KEYS.map((key) => {
          const value = currency[key] ?? 0
          const isEditing = editing === key

          return (
            <div
              key={key}
              className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-app)] p-2 text-center"
            >
              <div className="mb-1 text-[10px] text-[var(--text-subtle)] uppercase">
                {currencyShort(lang, key)}
              </div>

              {isEditing ? (
                <input
                  type="number"
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave(key)
                    if (e.key === 'Escape') {
                      setEditing(null)
                      setTempValue('')
                    }
                  }}
                  autoFocus
                  min={0}
                  className="w-full rounded border border-[var(--border-focus)] bg-[var(--bg-surface)] py-0.5 text-center text-sm focus:outline-none"
                />
              ) : (
                <button
                  onClick={() => {
                    if (!canEdit) return
                    setEditing(key)
                    setTempValue(String(value))
                  }}
                  disabled={!canEdit}
                  className={cn(
                    'text-lg font-bold',
                    COLORS[key],
                    canEdit && 'transition hover:text-[var(--text-primary)]'
                  )}
                >
                  {value}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
