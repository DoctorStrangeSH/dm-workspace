'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Shield, Sparkles, Trash2, Pencil, X } from 'lucide-react'
import {
  updateInventoryItem,
  removeInventoryItem,
  toggleEquipped,
  toggleAttuned,
} from '@/lib/actions/characters'
import { useToast } from '@/components/toast/toast-provider'
import { cn } from '@/lib/utils'
import type { CharacterInventoryItem } from '@/lib/types'

interface Props {
  item: CharacterInventoryItem
  characterId: string
  campaignId: string
  canEdit: boolean
}

export default function InventoryItem({ item, characterId, campaignId, canEdit }: Props) {
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(item.name)
  const [editQuantity, setEditQuantity] = useState(item.quantity)

  const itemId = item.id

  const handleSaveEdit = () => {
    if (!editName.trim() || editQuantity < 1) {
      toast.error('Некорректные значения')
      return
    }
    if (!itemId) return

    startTransition(async () => {
      const res = await updateInventoryItem(characterId, campaignId, itemId, {
        name: editName.trim(),
        quantity: editQuantity,
      })
      if ('error' in res) {
        toast.error(res.error)
      } else {
        setIsEditing(false)
        router.refresh()
      }
    })
  }

  const handleToggleEquipped = () => {
    if (!itemId) return
    startTransition(async () => {
      const res = await toggleEquipped(characterId, campaignId, itemId)
      if ('error' in res) toast.error(res.error)
      else router.refresh()
    })
  }

  const handleToggleAttuned = () => {
    if (!itemId) return
    startTransition(async () => {
      const res = await toggleAttuned(characterId, campaignId, itemId)
      if ('error' in res) toast.error(res.error)
      else router.refresh()
    })
  }

  const handleDelete = () => {
    if (!itemId) return
    if (!confirm(`Удалить «${item.name}»?`)) return
    startTransition(async () => {
      const res = await removeInventoryItem(characterId, campaignId, itemId)
      if ('error' in res) toast.error(res.error)
      else {
        toast.success('Предмет удалён')
        router.refresh()
      }
    })
  }

  return (
    <div className="group flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900 p-3">
      <div className="flex shrink-0 flex-col gap-1">
        {canEdit ? (
          <button
            onClick={handleToggleEquipped}
            disabled={isPending}
            className={cn(
              'flex h-5 w-5 items-center justify-center rounded border-2 transition',
              item.equipped
                ? 'border-sky-500 bg-sky-600'
                : 'border-slate-700 hover:border-slate-500'
            )}
            title={item.equipped ? 'Снять' : 'Экипировать'}
          >
            {item.equipped && <Shield size={10} className="text-white" />}
          </button>
        ) : (
          item.equipped && <Shield size={14} className="text-sky-400" />
        )}
        {item.attuned && <Sparkles size={14} className="text-violet-400" />}
      </div>

      <div className="min-w-0 flex-1">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="flex-1 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-white focus:border-indigo-500 focus:outline-none"
            />
            <input
              type="number"
              value={editQuantity}
              onChange={(e) => setEditQuantity(Number(e.target.value))}
              min={1}
              className="w-16 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-white focus:border-indigo-500 focus:outline-none"
            />
            <button
              onClick={handleSaveEdit}
              disabled={isPending}
              className="rounded p-1 hover:bg-slate-800"
            >
              <Check size={14} className="text-green-400" />
            </button>
            <button
              onClick={() => {
                setIsEditing(false)
                setEditName(item.name)
                setEditQuantity(item.quantity)
              }}
              className="rounded p-1 hover:bg-slate-800"
            >
              <X size={14} className="text-slate-400" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <span className="truncate font-medium text-slate-200">{item.name}</span>
              {item.quantity > 1 && (
                <span className="rounded bg-slate-800 px-1.5 py-0.5 text-xs text-slate-400">
                  ×{item.quantity}
                </span>
              )}
            </div>
            {item.notes && <p className="truncate text-xs text-slate-500">{item.notes}</p>}
          </>
        )}
      </div>

      {item.weight && item.weight > 0 && (
        <span className="shrink-0 text-xs text-slate-500">
          {(item.weight * item.quantity).toFixed(1)} lb
        </span>
      )}

      {canEdit && !isEditing && (
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
          <button
            onClick={handleToggleAttuned}
            disabled={isPending}
            className={cn(
              'rounded p-1.5 transition',
              item.attuned
                ? 'text-violet-400 hover:bg-violet-950/40'
                : 'text-slate-500 hover:bg-slate-800 hover:text-violet-400'
            )}
            title={item.attuned ? 'Отменить настройку' : 'Настроить'}
          >
            <Sparkles size={12} />
          </button>
          <button
            onClick={() => setIsEditing(true)}
            disabled={isPending}
            className="rounded p-1.5 transition hover:bg-slate-800"
            title="Редактировать"
          >
            <Pencil size={12} className="text-slate-400" />
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="rounded p-1.5 transition hover:bg-red-950/40"
            title="Удалить"
          >
            <Trash2 size={12} className="text-red-400" />
          </button>
        </div>
      )}
    </div>
  )
}
