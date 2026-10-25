'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { addSrdItemToCharacter } from '@/lib/actions/add-item-to-character'
import { addSrdItemToCampaign } from '@/lib/actions/add-item-to-campaign'
import { useToast } from '@/components/toast/toast-provider'
import { Button, Dialog, Select } from '@/components/ui'
import { useI18n } from '@/lib/i18n'
import { srdName } from '@/lib/types'
import type { SrdItem } from '@/lib/actions/items-search'

interface Props {
  item: SrdItem
  campaignId: string
  characters: Array<{ id: string; name: string }>
  canEditCampaign: boolean
  onClose: () => void
}

function rarityI18nKey(raw: string): string {
  return raw.replace(/\s+([a-z])/g, (_, c: string) => c.toUpperCase())
}

export default function SrdItemDetailDialog({
  item,
  campaignId,
  characters,
  canEditCampaign,
  onClose,
}: Props) {
  const { t, lang } = useI18n()
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [selectedChar, setSelectedChar] = useState<string | null>(characters[0]?.id ?? null)

  const data = item.data
  const rarity = (data.rarity ?? 'common').toLowerCase()

  const descriptionParts = [t(`itemRarity.${rarityI18nKey(rarity)}`)]
  if (data.item_type) descriptionParts.push(data.item_type)
  if (data.attunement) descriptionParts.push(t('items.attunement.requires'))

  const handleAddToCharacter = () => {
    if (!selectedChar) {
      toast.error(t('items.selectCharacter'))
      return
    }

    startTransition(async () => {
      const res = await addSrdItemToCharacter(item.key, selectedChar, campaignId)
      if ('error' in res) {
        toast.error(res.error ?? t('common.error'))
      } else {
        toast.success(t('items.toast.addedToCharacter'))
        router.refresh()
        onClose()
      }
    })
  }

  const handleAddToCampaign = () => {
    startTransition(async () => {
      const res = await addSrdItemToCampaign(item.key, campaignId)
      if ('error' in res) {
        toast.error(res.error ?? t('common.error'))
      } else {
        toast.success(t('items.toast.addedToCampaign'))
        router.refresh()
        onClose()
      }
    })
  }

  return (
    <Dialog
      open={true}
      onClose={onClose}
      title={srdName(item, lang)}
      description={descriptionParts.join(' · ')}
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
                {t('items.toCharacter')}
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
              {t('items.addToCampaignAsEntity')}
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-[var(--bg-app)] p-3">
          {data.cost && (
            <div>
              <span className="text-[var(--text-muted)]">{t('items.cost')}:</span>{' '}
              <span className="text-[var(--warning-text)]">{data.cost}</span>
            </div>
          )}
          {data.weight && (
            <div>
              <span className="text-[var(--text-muted)]">{t('items.weight')}:</span>{' '}
              <span className="text-[var(--text-secondary)]">{data.weight}</span>
            </div>
          )}
          {data.attunement && (
            <div>
              <span className="text-[var(--text-muted)]">{t('items.attunement.label')}:</span>{' '}
              <span className="text-[var(--accent-text)]">{t('items.attunement.required')}</span>
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
