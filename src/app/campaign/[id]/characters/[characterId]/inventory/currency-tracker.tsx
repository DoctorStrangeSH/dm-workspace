'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Coins } from 'lucide-react'
import { updateCurrency } from '@/lib/actions/characters'
import { useToast } from '@/components/toast/toast-provider'
import {
  CURRENCY_SHORT,
  type Currency,
} from '@/lib/types'
import { cn } from '@/lib/utils'

interface Props {
  characterId: string
  campaignId: string
  currency: Currency
  canEdit: boolean
}

const COLORS: Record<keyof Currency, string> = {
  pp: 'text-slate-300',
  gp: 'text-amber-300',
  sp: 'text-slate-400',
  cp: 'text-orange-400',
}

const COIN_KEYS: (keyof Currency)[] = ['pp', 'gp', 'sp', 'cp']

export default function CurrencyTracker({
  characterId,
  campaignId,
  currency,
  canEdit,
}: Props) {
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [editing, setEditing] = useState<keyof Currency | null>(null)
  const [tempValue, setTempValue] = useState('')

  const handleSave = (key: keyof Currency) => {
    const value = parseInt(tempValue, 10)
    if (isNaN(value) || value < 0) {
      toast.error('Введите положительное число')
      return
    }

    startTransition(async () => {
      const res = await updateCurrency(characterId, campaignId, {
        ...currency,
        [key]: value,
      })
      if ('error' in res) {
        toast.error(res.error ?? 'Ошибка')
      } else {
        toast.success('Деньги обновлены')
        setEditing(null)
        setTempValue('')
        router.refresh()
      }
    })
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Coins size={16} className="text-amber-400" />
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
          Деньги
        </h3>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {COIN_KEYS.map((key) => {
          const value = currency[key] ?? 0
          const isEditing = editing === key

          return (
            <div
              key={key}
              className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-center"
            >
              <div className="text-[10px] text-slate-500 uppercase mb-1">
                {CURRENCY_SHORT[key]}
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
                  className="w-full text-center bg-slate-900 border border-indigo-700 rounded text-sm py-0.5 focus:outline-none"
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
                    canEdit && 'hover:text-white transition'
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