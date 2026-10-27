'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { addInventoryItem } from '@/lib/actions/characters'
import { useToast } from '@/components/toast/toast-provider'
import { Input, Textarea, Button, IconButton } from '@/components/ui'
import { useI18n } from '@/lib/i18n'
import { ITEM_TYPES, ITEM_RARITIES, itemTypeLabel, itemRarityLabel, type ItemType, type ItemRarity } from '@/lib/dnd/inventory-metadata'

interface Props {
  characterId: string
  campaignId: string
  onClose: () => void
}

export default function AddItemDialog({ characterId, campaignId, onClose }: Props) {
  const { t, lang } = useI18n()
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [weight, setWeight] = useState('')
  const [notes, setNotes] = useState('')
  const [itemType, setItemType] = useState<ItemType>('other')
  const [rarity, setRarity] = useState<ItemRarity>('common')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error(t('inventory.form.nameRequired'))
      return
    }

    startTransition(async () => {
      const res = await addInventoryItem(characterId, campaignId, {
        name: name.trim(),
        quantity: Math.max(1, quantity),
        weight: weight ? parseFloat(weight) : undefined,
        notes: notes || undefined,
        itemType,
        rarity,
      })
      if ('error' in res) {
        toast.error(res.error)
        return
      }
      toast.success(t('inventory.toast.itemAdded'))
      router.refresh()
      onClose()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center overflow-hidden bg-[var(--bg-overlay)] p-2 pt-[calc(0.5rem+env(safe-area-inset-top))] pb-[calc(0.5rem+env(safe-area-inset-bottom))] backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex min-h-0 w-full max-w-md flex-col overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] sm:max-h-[calc(100dvh-2rem)]">
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--border-default)] p-3 sm:p-4">
          <h2 className="font-semibold text-[var(--text-primary)]">{t('inventory.form.title')}</h2>
          <IconButton
            variant="ghost"
            size="sm"
            label={t('common.close')}
            onClick={onClose}
            disabled={isPending}
          >
            <X size={18} />
          </IconButton>
        </div>

        <form id="add-character-item-form" onSubmit={handleSubmit} className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-3 sm:p-4">
          <Input
            label={t('common.name')}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('inventory.form.namePlaceholder')}
            autoFocus
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t('inventory.form.quantity')}
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              min={1}
            />
            <Input
              label={t('inventory.form.weight')}
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              min={0}
              step="0.1"
              placeholder="3"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm text-[var(--text-secondary)]">
              {lang === 'en' ? 'Item type' : 'Тип предмета'}
              <select value={itemType} onChange={(e) => setItemType(e.target.value as ItemType)} className="min-h-10 rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] px-3 text-[var(--text-primary)]">
                {ITEM_TYPES.map((type) => <option key={type} value={type}>{itemTypeLabel(type, lang)}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm text-[var(--text-secondary)]">
              {lang === 'en' ? 'Rarity' : 'Редкость'}
              <select value={rarity} onChange={(e) => setRarity(e.target.value as ItemRarity)} className="min-h-10 rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] px-3 text-[var(--text-primary)]">
                {ITEM_RARITIES.map((value) => <option key={value} value={value}>{itemRarityLabel(value, lang)}</option>)}
              </select>
            </label>
          </div>

          <Textarea
            label={t('inventory.form.notes')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder={t('inventory.form.notesPlaceholder')}
          />


        </form>
          <div className="flex shrink-0 flex-wrap justify-end gap-3 border-t border-[var(--border-default)] bg-[var(--bg-surface)] p-3 sm:p-4">
            <Button
              type="button"
              variant="secondary"
              size="md" className="min-h-11"
              onClick={onClose}
              disabled={isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button form="add-character-item-form" type="submit" variant="primary" size="md" className="min-h-11" loading={isPending}>
              {isPending ? t('inventory.form.adding') : t('common.add')}
            </Button>
          </div>
      </div>
    </div>
  )
}
