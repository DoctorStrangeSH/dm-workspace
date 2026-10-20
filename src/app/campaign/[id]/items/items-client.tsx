'use client'

import { useState, useEffect, useTransition } from 'react'
import ItemsSearch from './items-search'
import SrdItemCard from './srd-item-card'
import SrdItemDetailDialog from './srd-item-detail-dialog'
import { EmptyState } from '@/components/ui'
import { searchSrdItemsAction, type SrdItem } from '@/lib/actions/items-search'

interface Props {
  campaignId: string
  initialItems: SrdItem[]
  characters: Array<{ id: string; name: string }>
  availableTypes: string[]
  availableRarities: string[]
  canEditCampaign: boolean
}

export default function ItemsClient({
  campaignId,
  initialItems,
  characters,
  availableTypes,
  availableRarities,
  canEditCampaign,
}: Props) {
  const [items, setItems] = useState(initialItems)
  const [query, setQuery] = useState('')
  const [types, setTypes] = useState<string[]>([])
  const [rarities, setRarities] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()
  const [selectedItem, setSelectedItem] = useState<SrdItem | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(async () => {
        const results = await searchSrdItemsAction({
          query,
          type: types,
          rarity: rarities,
          limit: 100,
        })
        setItems(results)
      })
    }, 300)

    return () => clearTimeout(timer)
  }, [query, types, rarities])

  return (
    <>
      <ItemsSearch
        onSearch={setQuery}
        onFilterType={setTypes}
        onFilterRarity={setRarities}
        availableTypes={availableTypes}
        availableRarities={availableRarities}
        isPending={isPending}
      />

      {items.length === 0 ? (
        <EmptyState
          icon="🎒"
          title={
            query || types.length > 0 || rarities.length > 0
              ? 'Ничего не найдено'
              : 'Предметов пока нет'
          }
          description="Попробуй изменить фильтры или поиск"
          size="md"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <SrdItemCard
              key={item.key}
              item={item}
              canEdit={characters.length > 0}
              onAddToCharacter={() => setSelectedItem(item)}
              onView={() => setSelectedItem(item)}
            />
          ))}
        </div>
      )}

      {selectedItem && (
        <SrdItemDetailDialog
          item={selectedItem}
          campaignId={campaignId}
          characters={characters}
          canEditCampaign={canEditCampaign}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </>
  )
}
