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
import { Button, Dialog } from '@/components/ui'
import { useT } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import type { CharacterInventoryItem } from '@/lib/types'

interface Props {
  item: CharacterInventoryItem
  characterId: string
  campaignId: string
  canEdit: boolean
}

export default function InventoryItem({ item, characterId, campaignId, canEdit }: Props) {
  const t = useT()
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(item.name)
  const [editQuantity, setEditQuantity] = useState(item.quantity)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const itemId = item.id

  const handleSaveEdit = () => {
    if (!editName.trim() || editQuantity < 1) {
      toast.error(t('inventory.item.invalidValues'))
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
    startTransition(async () => {
      const res = await removeInventoryItem(characterId, campaignId, itemId)
      if ('error' in res) {
        toast.error(res.error)
      } else {
        toast.success(t('inventory.item.deleted'))
        setShowDeleteConfirm(false)
        router.refresh()
      }
    })
  }

  return (
    <>
      <div className="group flex items-center gap-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-3">
        <div className="flex shrink-0 flex-col gap-1">
          {canEdit ? (
            <button
              onClick={handleToggleEquipped}
              disabled={isPending}
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded border-2 transition',
                item.equipped
                  ? 'border-[var(--info)] bg-[var(--info)]'
                  : 'border-[var(--border-default)] hover:border-[var(--border-hover)]'
              )}
              title={item.equipped ? t('inventory.item.unequip') : t('inventory.item.equip')}
            >
              {item.equipped && <Shield size={10} className="text-white" />}
            </button>
          ) : (
            item.equipped && <Shield size={14} className="text-[var(--info-text)]" />
          )}
          {item.attuned && <Sparkles size={14} className="text-[var(--accent-text)]" />}
        </div>

        <div className="min-w-0 flex-1">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="flex-1 rounded border border-[var(--border-default)] bg-[var(--bg-primary)] px-2 py-1 text-sm text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none"
              />
              <input
                type="number"
                value={editQuantity}
                onChange={(e) => setEditQuantity(Number(e.target.value))}
                min={1}
                className="w-16 rounded border border-[var(--border-default)] bg-[var(--bg-primary)] px-2 py-1 text-sm text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none"
              />
              <button
                onClick={handleSaveEdit}
                disabled={isPending}
                className="rounded p-1 hover:bg-[var(--bg-hover)]"
              >
                <Check size={14} className="text-[var(--success)]" />
              </button>
              <button
                onClick={() => {
                  setIsEditing(false)
                  setEditName(item.name)
                  setEditQuantity(item.quantity)
                }}
                className="rounded p-1 hover:bg-[var(--bg-hover)]"
              >
                <X size={14} className="text-[var(--text-muted)]" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="truncate font-medium text-[var(--text-primary)]">{item.name}</span>
                {item.quantity > 1 && (
                  <span className="rounded bg-[var(--bg-secondary)] px-1.5 py-0.5 text-xs text-[var(--text-muted)]">
                    ×{item.quantity}
                  </span>
                )}
              </div>
              {item.notes && (
                <p className="truncate text-xs text-[var(--text-muted)]">{item.notes}</p>
              )}
            </>
          )}
        </div>

        {item.weight && item.weight > 0 && (
          <span className="shrink-0 text-xs text-[var(--text-muted)]">
            {(item.weight * item.quantity).toFixed(1)} {t('inventory.item.lb')}
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
                  ? 'text-[var(--accent-text)] hover:bg-[var(--accent-subtle)]'
                  : 'text-[var(--text-subtle)] hover:bg-[var(--bg-hover)] hover:text-[var(--accent-text)]'
              )}
              title={item.attuned ? t('inventory.item.unattune') : t('inventory.item.attune')}
            >
              <Sparkles size={12} />
            </button>
            <button
              onClick={() => setIsEditing(true)}
              disabled={isPending}
              className="rounded p-1.5 transition hover:bg-[var(--bg-hover)]"
              title={t('common.edit')}
            >
              <Pencil size={12} className="text-[var(--text-muted)]" />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isPending}
              className="rounded p-1.5 transition hover:bg-[var(--danger-subtle)]"
              title={t('common.delete')}
            >
              <Trash2 size={12} className="text-[var(--danger)]" />
            </button>
          </div>
        )}
      </div>

      {/* CHANGES: confirm() → Dialog */}
      <Dialog
        open={showDeleteConfirm}
        onClose={() => !isPending && setShowDeleteConfirm(false)}
        title={t('inventory.item.deleteConfirm.title')}
        description={t('inventory.item.deleteConfirm.description', { name: item.name })}
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button variant="danger" size="md" onClick={handleDelete} loading={isPending}>
              {t('common.delete')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-[var(--text-muted)]">
          {t('inventory.item.deleteConfirm.cannotUndo')}
        </p>
      </Dialog>
    </>
  )
}
