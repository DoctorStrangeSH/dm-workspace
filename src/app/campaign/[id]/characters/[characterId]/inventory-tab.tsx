'use client'

import { useState, useMemo } from 'react'
import { Plus, Package, Sparkles, Shield } from 'lucide-react'
import { EmptyState, Button } from '@/components/ui'
import CurrencyTracker from './inventory/currency-tracker'
import EncumbranceBar from './inventory/encumbrance-bar'
import InventoryItem from './inventory/inventory-item'
import AddItemDialog from './inventory/add-item-dialog'
import { getCarryingCapacity, MAX_ATTUNEMENTS } from '@/lib/types'
import { useI18n } from '@/lib/i18n'
import type { Character } from '@/lib/types'

interface Props {
  character: Character
  campaignId: string
  canEdit: boolean
}

export default function InventoryTab({ character, campaignId, canEdit }: Props) {
  const { t } = useI18n()
  const [showAddDialog, setShowAddDialog] = useState(false)

  const data = character.data_json

  const inventory = useMemo(
    () => character.data_json.inventory ?? [],
    [character.data_json.inventory]
  )
  const currency = data.currency ?? {}

  const totalWeight = useMemo(
    () => inventory.reduce((sum, item) => sum + (item.weight ?? 0) * item.quantity, 0),
    [inventory]
  )

  const capacity = getCarryingCapacity(data.abilities.str)

  const equipped = inventory.filter((i) => i.equipped && !i.attuned)
  const attuned = inventory.filter((i) => i.attuned)
  const other = inventory.filter((i) => !i.equipped && !i.attuned)

  const attunedCount = attuned.length

  const groups = [
    {
      title: t('inventory.group.attuned'),
      icon: Sparkles,
      color: 'text-[var(--accent-text)]',
      items: attuned,
      badge: `${attunedCount}/${MAX_ATTUNEMENTS}`,
    },
    {
      title: t('inventory.group.equipped'),
      icon: Shield,
      color: 'text-[var(--info-text)]',
      items: equipped,
    },
    {
      title: t('inventory.group.other'),
      icon: Package,
      color: 'text-[var(--text-muted)]',
      items: other,
    },
  ].filter((g) => g.items.length > 0)

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        {canEdit && (
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => setShowAddDialog(true)}
          >
            {t('inventory.add')}
          </Button>
        )}
        <div className="ml-auto text-sm text-[var(--text-muted)]">
          {t('inventory.itemsCount')}: {inventory.length}
        </div>
      </div>

      <CurrencyTracker
        characterId={character.id}
        campaignId={campaignId}
        currency={currency}
        canEdit={canEdit}
      />

      <EncumbranceBar currentWeight={totalWeight} capacity={capacity} />

      {inventory.length === 0 ? (
        <EmptyState
          icon="🎒"
          title={t('inventory.empty.title')}
          description={
            canEdit ? t('inventory.empty.descriptionEdit') : t('inventory.empty.descriptionPlayer')
          }
          size="md"
          dashed={false}
        />
      ) : (
        <div className="space-y-4">
          {groups.map((group) => {
            const Icon = group.icon
            return (
              <div key={group.title}>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold tracking-wider text-[var(--text-muted)] uppercase">
                  <Icon size={14} className={group.color} />
                  {group.title}
                  {group.badge && (
                    <span className="font-normal text-[var(--text-subtle)]">({group.badge})</span>
                  )}
                </h3>
                <div className="space-y-1.5">
                  {group.items.map((item) => (
                    <InventoryItem
                      key={item.id}
                      item={item}
                      characterId={character.id}
                      campaignId={campaignId}
                      canEdit={canEdit}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showAddDialog && (
        <AddItemDialog
          characterId={character.id}
          campaignId={campaignId}
          onClose={() => setShowAddDialog(false)}
        />
      )}
    </div>
  )
}
