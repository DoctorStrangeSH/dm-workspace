'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { X, Plus, Loader2, Package } from 'lucide-react'
import {
  addSrdItemToCharacter,
} from '@/lib/actions/add-item-to-character'
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
  const [selectedChar, setSelectedChar] = useState<string | null>(
    characters[0]?.id ?? null
  )

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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col my-auto">
        <div className="flex items-start justify-between gap-4 p-4 border-b border-slate-800">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
              <Package size={18} className="text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold">
                {item.name_ru ?? item.name}
              </h2>
              <p className="text-sm text-slate-400 mt-0.5">
                <span className={cn('capitalize font-medium', rarityColor)}>
                  {rarity}
                </span>
                {data.item_type && ` · ${data.item_type}`}
                {data.attunement && ' · требует настройки'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded transition shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-2 p-3 bg-slate-950/50 rounded-lg">
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
            <div className="text-slate-300 whitespace-pre-wrap">
              {data.description}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-800 space-y-3">
          {characters.length > 0 && (
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Добавить персонажу:
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={selectedChar ?? ''}
                  onChange={(e) => setSelectedChar(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
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
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition text-sm font-medium disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Plus size={14} />
                  )}
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
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition text-sm disabled:opacity-50"
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