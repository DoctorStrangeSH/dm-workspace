'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { X, Plus, Loader2, Package } from 'lucide-react'
import { addSrdItemToCharacter } from '@/lib/actions/add-item-to-character'
import { addSrdItemToCampaign } from '@/lib/actions/add-item-to-campaign'
import { useToast } from '@/components/toast/toast-provider'
import { cn } from '@/lib/utils'
import type { SrdItem } from '@/lib/actions/items-search'

interface Props {
  item: SrdItem
  campaignId: string
  characters: Array<{ id: string; name: string }>
  canEditCampaign: boolean
  onClose: () => void
}

const RARITY_COLORS: Record<string, string> = {
  common: 'text-slate-400',
  uncommon: 'text-emerald-400',
  rare: 'text-sky-400',
  'very rare': 'text-violet-400',
  legendary: 'text-amber-400',
  artifact: 'text-red-400',
}

export default function SrdItemDetailDialog({
  item,
  campaignId,
  characters,
  canEditCampaign,
  onClose,
}: Props) {
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [selectedChar, setSelectedChar] = useState<string | null>(characters[0]?.id ?? null)

  const data = item.data
  const rarity = (data.rarity ?? 'common').toLowerCase()
  const rarityColor = RARITY_COLORS[rarity] ?? 'text-slate-400'

  const handleAddToCharacter = () => {
    if (!selectedChar) {
      toast.error('Выбери персонажа')
      return
    }

    startTransition(async () => {
      const res = await addSrdItemToCharacter(item.key, selectedChar, campaignId)
      if ('error' in res) {
        toast.error(res.error ?? 'Ошибка')
      } else {
        toast.success('Предмет добавлен в инвентарь')
        router.refresh()
        onClose()
      }
    })
  }

  const handleAddToCampaign = () => {
    startTransition(async () => {
      const res = await addSrdItemToCampaign(item.key, campaignId)
      if ('error' in res) {
        toast.error(res.error ?? 'Ошибка')
      } else {
        toast.success('Предмет добавлен в кампанию')
        router.refresh()
        onClose()
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
      <div className="my-auto flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-800 bg-slate-900">
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 p-4">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-800">
              <Package size={18} className="text-slate-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold">{item.name_ru ?? item.name}</h2>
              <p className="mt-0.5 text-sm text-slate-400">
                <span className={cn('font-medium capitalize', rarityColor)}>{rarity}</span>
                {data.item_type && ` · ${data.item_type}`}
                {data.attunement && ' · требует настройки'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="shrink-0 rounded p-1 transition hover:bg-slate-800">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-950/50 p-3">
            {data.cost && (
              <div>
                <span className="text-slate-500">Стоимость:</span>{' '}
                <span className="text-amber-300">{data.cost}</span>
              </div>
            )}
            {data.weight && (
              <div>
                <span className="text-slate-500">Вес:</span>{' '}
                <span className="text-slate-300">{data.weight}</span>
              </div>
            )}
            {data.attunement && (
              <div>
                <span className="text-slate-500">Настройка:</span>{' '}
                <span className="text-violet-300">требуется</span>
              </div>
            )}
          </div>

          {data.description && (
            <div className="whitespace-pre-wrap text-slate-300">{data.description}</div>
          )}
        </div>

        <div className="space-y-3 border-t border-slate-800 p-4">
          {characters.length > 0 && (
            <div>
              <label className="mb-1 block text-xs text-slate-400">Добавить персонажу:</label>
              <div className="flex items-center gap-2">
                <select
                  value={selectedChar ?? ''}
                  onChange={(e) => setSelectedChar(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                >
                  {characters.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAddToCharacter}
                  disabled={isPending}
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
                >
                  {isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  Персонажу
                </button>
              </div>
            </div>
          )}

          {canEditCampaign && (
            <div>
              <button
                onClick={handleAddToCampaign}
                disabled={isPending}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-700 disabled:opacity-50"
              >
                <Plus size={14} />
                Добавить в кампанию (как сущность)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
