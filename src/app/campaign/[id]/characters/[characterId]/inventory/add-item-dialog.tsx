'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { addInventoryItem } from '@/lib/actions/characters'
import { useToast } from '@/components/toast/toast-provider'
import { Input, Textarea, Button, IconButton } from '@/components/ui'
import { useT } from '@/lib/i18n'

interface Props {
  characterId: string
  campaignId: string
  onClose: () => void
}

export default function AddItemDialog({ characterId, campaignId, onClose }: Props) {
  const t = useT()
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [weight, setWeight] = useState('')
  const [notes, setNotes] = useState('')

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-overlay)] p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)]">
        <div className="flex items-center justify-between border-b border-[var(--border-default)] p-4">
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

        <form onSubmit={handleSubmit} className="space-y-3 p-4">
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

          <Textarea
            label={t('inventory.form.notes')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder={t('inventory.form.notesPlaceholder')}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={onClose}
              disabled={isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="primary" size="md" loading={isPending}>
              {isPending ? t('inventory.form.adding') : t('common.add')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
