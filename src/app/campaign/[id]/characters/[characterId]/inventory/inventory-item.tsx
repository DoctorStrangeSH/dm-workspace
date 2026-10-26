'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Shield, Sparkles, Trash2, Pencil, X, Package } from 'lucide-react'
import {
  updateInventoryItem,
  removeInventoryItem,
  toggleEquipped,
  toggleAttuned,
} from '@/lib/actions/characters'
import { useToast } from '@/components/toast/toast-provider'
import { Button, Dialog } from '@/components/ui'
import { useI18n } from '@/lib/i18n'
import { ITEM_TYPES, ITEM_RARITIES, itemTypeLabel, itemRarityLabel, itemRarityClass, type ItemType, type ItemRarity } from '@/lib/dnd/inventory-metadata'
import { cn } from '@/lib/utils'
import type { CharacterInventoryItem } from '@/lib/types'

interface Props {
  item: CharacterInventoryItem
  characterId: string
  campaignId: string
  canEdit: boolean
}

export default function InventoryItem({ item, characterId, campaignId, canEdit }: Props) {
  const { t, lang } = useI18n()
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(item.name)
  const [editQuantity, setEditQuantity] = useState(item.quantity)
  const [editType, setEditType] = useState<ItemType>(item.itemType ?? 'other')
  const [editRarity, setEditRarity] = useState<ItemRarity>(item.rarity ?? 'common')
  const [editAcBonus, setEditAcBonus] = useState(item.acBonus ?? 0)
  const [editInitiativeBonus, setEditInitiativeBonus] = useState(item.initiativeBonus ?? 0)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const itemId = item.id

  const handleSaveEdit = () => {
    if (!editName.trim() || !Number.isSafeInteger(editQuantity) || editQuantity < 1 || ![editAcBonus, editInitiativeBonus].every(n => Number.isInteger(n) && n >= -5 && n <= 5)) {
      toast.error(t('inventory.item.invalidValues'))
      return
    }
    if (!itemId) return

    startTransition(async () => {
      const res = await updateInventoryItem(characterId, campaignId, itemId, {
        name: editName.trim(),
        quantity: editQuantity,
        itemType: editType,
        rarity: editRarity,
        acBonus: editAcBonus,
        initiativeBonus: editInitiativeBonus,
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
      <div className="group rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-3 transition-colors hover:border-[var(--accent)]/40">
        <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-subtle)] text-[var(--accent-text)]">{item.attuned ? <Sparkles size={18} /> : item.equipped ? <Shield size={18} /> : <Package size={18} />}</div>
        <div className="flex shrink-0 items-center gap-1">
          {canEdit ? (
            <button
              onClick={handleToggleEquipped}
              disabled={isPending}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-lg border-2 transition focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]',
                item.equipped
                  ? 'border-[var(--info)] bg-[var(--info)]'
                  : 'border-[var(--border-default)] hover:border-[var(--border-hover)]'
              )}
              title={item.equipped ? t('inventory.item.unequip') : t('inventory.item.equip')}
              aria-label={`${item.name}: ${item.equipped ? t('inventory.item.unequip') : t('inventory.item.equip')}`}
              aria-pressed={!!item.equipped}
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
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="min-w-28 flex-1 rounded border border-[var(--border-default)] bg-[var(--bg-primary)] px-2 py-1 text-sm text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none"
              />
              <input
                type="number"
                value={editQuantity}
                onChange={(e) => setEditQuantity(Number(e.target.value))}
                min={1}
                className="w-16 rounded border border-[var(--border-default)] bg-[var(--bg-primary)] px-2 py-1 text-sm text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none"
              />
              <select aria-label={lang === 'en' ? 'Item type' : 'Тип предмета'} value={editType} onChange={(e) => setEditType(e.target.value as ItemType)} className="min-h-9 min-w-0 rounded border border-[var(--border-default)] bg-[var(--bg-primary)] px-2 text-sm text-[var(--text-primary)]">
                {ITEM_TYPES.map((value) => <option key={value} value={value}>{itemTypeLabel(value, lang)}</option>)}
              </select>
              <select aria-label={lang === 'en' ? 'Rarity' : 'Редкость'} value={editRarity} onChange={(e) => setEditRarity(e.target.value as ItemRarity)} className="min-h-9 min-w-0 rounded border border-[var(--border-default)] bg-[var(--bg-primary)] px-2 text-sm text-[var(--text-primary)]">
                {ITEM_RARITIES.map((value) => <option key={value} value={value}>{itemRarityLabel(value, lang)}</option>)}
              </select>
              <label className="flex flex-col gap-1 text-xs text-[var(--text-muted)]">${lang === 'en' ? 'AC bonus' : 'Бонус КД'}<input type="number" min={-5} max={5} step={1} value={editAcBonus} onChange={e => setEditAcBonus(Number(e.target.value))} className="w-20 rounded border border-[var(--border-default)] bg-[var(--bg-primary)] p-2 text-[var(--text-primary)]" /></label>
              <label className="flex flex-col gap-1 text-xs text-[var(--text-muted)]">${lang === 'en' ? 'Initiative' : 'Инициатива'}<input type="number" min={-5} max={5} step={1} value={editInitiativeBonus} onChange={e => setEditInitiativeBonus(Number(e.target.value))} className="w-20 rounded border border-[var(--border-default)] bg-[var(--bg-primary)] p-2 text-[var(--text-primary)]" /></label>
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
                  setEditType(item.itemType ?? 'other')
                  setEditRarity(item.rarity ?? 'common')
                  setEditAcBonus(item.acBonus ?? 0)
                  setEditInitiativeBonus(item.initiativeBonus ?? 0)
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
              {(item.itemType || item.rarity) && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {item.itemType && itemTypeLabel(item.itemType, lang) && (
                    <span className="rounded-md border border-[var(--border-default)] px-2 py-0.5 text-[11px] text-[var(--text-muted)]">{itemTypeLabel(item.itemType, lang)}</span>
                  )}
                  {item.rarity && itemRarityLabel(item.rarity, lang) && (
                    <span className={cn('rounded-md border px-2 py-0.5 text-[11px] font-semibold', itemRarityClass(item.rarity))}>{itemRarityLabel(item.rarity, lang)}</span>
                  )}
                </div>
              )}
              {(item.acBonus !== undefined && item.acBonus !== 0 || item.initiativeBonus !== undefined && item.initiativeBonus !== 0) && (
                <div className="mt-1 text-xs text-[var(--accent-text)]">
                  {lang === 'en' ? 'Bonuses when equipped' : 'Бонусы при экипировке'}:
                  {item.acBonus ? ` AC ${item.acBonus > 0 ? '+' : ''}${item.acBonus}` : ''}
                  {item.initiativeBonus ? ` · ${lang === 'en' ? 'Initiative' : 'Инициатива'} ${item.initiativeBonus > 0 ? '+' : ''}${item.initiativeBonus}` : ''}
                </div>
              )}
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
          <div className="ml-auto flex shrink-0 items-center gap-1 md:opacity-60 md:transition-opacity md:group-hover:opacity-100 md:group-focus-within:opacity-100">
            <button
              onClick={handleToggleAttuned}
              disabled={isPending}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-lg transition focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]',
                item.attuned
                  ? 'text-[var(--accent-text)] hover:bg-[var(--accent-subtle)]'
                  : 'text-[var(--text-subtle)] hover:bg-[var(--bg-hover)] hover:text-[var(--accent-text)]'
              )}
              title={item.attuned ? t('inventory.item.unattune') : t('inventory.item.attune')}
              aria-label={`${item.name}: ${item.attuned ? t('inventory.item.unattune') : t('inventory.item.attune')}`}
              aria-pressed={!!item.attuned}
            >
              <Sparkles size={12} />
            </button>
            <button
              onClick={() => setIsEditing(true)}
              disabled={isPending}
              className="flex h-9 w-9 items-center justify-center rounded-lg transition hover:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
              title={t('common.edit')}
              aria-label={`${t('common.edit')}: ${item.name}`}
            >
              <Pencil size={12} className="text-[var(--text-muted)]" />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isPending}
              className="flex h-9 w-9 items-center justify-center rounded-lg transition hover:bg-[var(--danger-subtle)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
              title={t('common.delete')}
              aria-label={`${t('common.delete')}: ${item.name}`}
            >
              <Trash2 size={12} className="text-[var(--danger)]" />
            </button>
          </div>
        )}
        </div>
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
