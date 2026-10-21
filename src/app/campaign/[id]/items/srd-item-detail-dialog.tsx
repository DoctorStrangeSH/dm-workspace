'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { addSrdItemToCharacter } from '@/lib/actions/add-item-to-character'
import { addSrdItemToCampaign } from '@/lib/actions/add-item-to-campaign'
import { useToast } from '@/components/toast/toast-provider'
import { Button, Dialog, Select } from '@/components/ui'
import type { SrdItem } from '@/lib/actions/items-search'

interface Props {
  item: SrdItem
  campaignId: string
  characters: Array<{ id: string; name: string }>
  canEditCampaign: boolean
  onClose: () => void
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
    <Dialog
      open={true}
      onClose={onClose}
      title={item.name_ru ?? item.name}
      description={`${rarity}${data.item_type ? ` · ${data.item_type}` : ''}${data.attunement ? ' · требует настройки' : ''}`}
      size="lg"
      footer={
        <div className="flex w-full flex-col gap-2">
          {characters.length > 0 && (
            <div className="flex items-center gap-2">
              <Select
                value={selectedChar ?? ''}
                onChange={(e) => setSelectedChar(e.target.value)}
                options={characters.map((c) => ({ value: c.id, label: c.name }))}
                className="flex-1"
              />
              <Button
                variant="primary"
                size="md"
                icon={<Plus size={14} />}
                onClick={handleAddToCharacter}
                loading={isPending}
              >
                Персонажу
              </Button>
            </div>
          )}
          {canEditCampaign && (
            <Button
              variant="secondary"
              size="md"
              icon={<Plus size={14} />}
              onClick={handleAddToCampaign}
              loading={isPending}
              className="w-full"
            >
              Добавить в кампанию (как сущность)
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-[var(--bg-app)] p-3">
          {data.cost && (
            <div>
              <span className="text-[var(--text-muted)]">Стоимость:</span>{' '}
              <span className="text-[var(--warning-text)]">{data.cost}</span>
            </div>
          )}
          {data.weight && (
            <div>
              <span className="text-[var(--text-muted)]">Вес:</span>{' '}
              <span className="text-[var(--text-secondary)]">{data.weight}</span>
            </div>
          )}
          {data.attunement && (
            <div>
              <span className="text-[var(--text-muted)]">Настройка:</span>{' '}
              <span className="text-[var(--accent-text)]">требуется</span>
            </div>
          )}
        </div>

        {data.description && (
          <div className="whitespace-pre-wrap text-[var(--text-secondary)]">{data.description}</div>
        )}
      </div>
    </Dialog>
  )
}
