'use client'

import { useState, useMemo } from 'react'
import { Plus, Package, Sparkles, Shield } from 'lucide-react'
import EmptyState from '@/components/empty-state'
import CurrencyTracker from './inventory/currency-tracker'
import EncumbranceBar from './inventory/encumbrance-bar'
import InventoryItem from './inventory/inventory-item'
import AddItemDialog from './inventory/add-item-dialog'
import { getCarryingCapacity, MAX_ATTUNEMENTS } from '@/lib/types'
import type { Character } from '@/lib/types'

interface Props {
  character: Character
  campaignId: string
  canEdit: boolean
}

export default function InventoryTab({ character, campaignId, canEdit }: Props) {
  const [showAddDialog, setShowAddDialog] = useState(false)

  const data = character.data_json

  // CHANGES: обёрнуто в useMemo, чтобы ссылка на inventory была стабильной.
  // Раньше `data.inventory ?? []` создавал новый [] каждый рендер,
  // из-за чего useMemo(totalWeight) пересчитывался всегда.
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
      title: 'Настроено',
      icon: Sparkles,
      color: 'text-violet-400',
      items: attuned,
      badge: `${attunedCount}/${MAX_ATTUNEMENTS}`,
    },
    {
      title: 'Экипировано',
      icon: Shield,
      color: 'text-sky-400',
      items: equipped,
    },
    {
      title: 'Прочее',
      icon: Package,
      color: 'text-slate-400',
      items: other,
    },
  ].filter((g) => g.items.length > 0)

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        {canEdit && (
          <button
            onClick={() => setShowAddDialog(true)}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm text-white transition hover:bg-indigo-500"
          >
            <Plus size={14} />
            Добавить предмет
          </button>
        )}
        <div className="ml-auto text-sm text-slate-500">Предметов: {inventory.length}</div>
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
          title="Инвентарь пуст"
          description={
            canEdit
              ? 'Добавь первый предмет — оружие, броню или зелье.'
              : 'У персонажа нет предметов.'
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
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold tracking-wider text-slate-400 uppercase">
                  <Icon size={14} className={group.color} />
                  {group.title}
                  {group.badge && (
                    <span className="font-normal text-slate-600">({group.badge})</span>
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
