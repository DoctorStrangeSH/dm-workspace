'use client'

import { useState, useMemo } from 'react'
import { Plus, Package, Sparkles, Shield, Search, X } from 'lucide-react'
import { EmptyState, Button } from '@/components/ui'
import CurrencyTracker from './inventory/currency-tracker'
import EncumbranceBar from './inventory/encumbrance-bar'
import InventoryItem from './inventory/inventory-item'
import AddItemDialog from './inventory/add-item-dialog'
import { getCarryingCapacity, MAX_ATTUNEMENTS } from '@/lib/types'
import { useI18n } from '@/lib/i18n'
import { ITEM_TYPES, ITEM_RARITIES, itemTypeLabel, itemRarityLabel } from '@/lib/dnd/inventory-metadata'
import type { Character } from '@/lib/types'

interface Props {
  character: Character
  campaignId: string
  canEdit: boolean
}

export default function InventoryTab({ character, campaignId, canEdit }: Props) {
  const { t, lang } = useI18n()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [rarityFilter, setRarityFilter] = useState('all')
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

  const filteredInventory = useMemo(() => inventory.filter((item) => {
    const term = search.trim().toLocaleLowerCase(lang === 'ru' ? 'ru' : 'en')
    return (!term || item.name.toLocaleLowerCase(lang === 'ru' ? 'ru' : 'en').includes(term) || (item.notes ?? '').toLocaleLowerCase(lang === 'ru' ? 'ru' : 'en').includes(term))
      && (typeFilter === 'all' || (item.itemType ?? 'other') === typeFilter)
      && (rarityFilter === 'all' || (item.rarity ?? 'common') === rarityFilter)
  }), [inventory, search, typeFilter, rarityFilter, lang])

  const equipped = inventory.filter((i) => i.equipped && !i.attuned)
  const attuned = inventory.filter((i) => i.attuned)
  const other = inventory.filter((i) => !i.equipped && !i.attuned)

  const attunedCount = attuned.length

  const groups = [
    {
      title: t('inventory.group.attuned'),
      icon: Sparkles,
      color: 'text-[var(--accent-text)]',
      items: filteredInventory.filter((i) => i.attuned),
      badge: `${attunedCount}/${MAX_ATTUNEMENTS}`,
    },
    {
      title: t('inventory.group.equipped'),
      icon: Shield,
      color: 'text-[var(--info-text)]',
      items: filteredInventory.filter((i) => i.equipped && !i.attuned),
    },
    {
      title: t('inventory.group.other'),
      icon: Package,
      color: 'text-[var(--text-muted)]',
      items: filteredInventory.filter((i) => !i.equipped && !i.attuned),
    },
  ].filter((g) => g.items.length > 0)

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
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

      {inventory.length > 0 && (
        <div className="mb-4 grid grid-cols-3 gap-2" aria-label={t('inventory.itemsCount')}>
          {[
            { label: t('inventory.group.attuned'), count: attuned.length, icon: Sparkles },
            { label: t('inventory.group.equipped'), count: equipped.length, icon: Shield },
            { label: t('inventory.group.other'), count: other.length, icon: Package },
          ].map(({ label, count, icon: Icon }) => (
            <div key={label} className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-3 transition-colors hover:border-[var(--accent)]/30">
              <Icon size={16} className="mb-2 text-[var(--accent-text)]" aria-hidden="true" />
              <div className="text-xl font-bold tabular-nums text-[var(--text-primary)]">{count}</div>
              <div className="break-words text-xs text-[var(--text-muted)]">{label}</div>
            </div>
          ))}
        </div>
      )}

      {inventory.length > 0 && (
        <section aria-label={lang === 'en' ? 'Inventory filters' : 'Фильтры инвентаря'} className="mb-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-3 sm:p-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
            <label className="relative min-w-0">
              <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-3 text-[var(--text-muted)]" />
              <span className="sr-only">{lang === 'en' ? 'Search inventory' : 'Поиск по инвентарю'}</span>
              <input type="search" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder={lang === 'en' ? 'Search items…' : 'Найти предмет…'}
                className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] py-2 pl-9 pr-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]" />
            </label>
            <label className="min-w-0">
              <span className="sr-only">{lang === 'en' ? 'Filter by type' : 'Фильтр по типу'}</span>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
                className="min-h-10 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] px-3 text-sm text-[var(--text-primary)] sm:max-w-48">
                <option value="all">{lang === 'en' ? 'All types' : 'Все типы'}</option>
                {ITEM_TYPES.map((type) => <option key={type} value={type}>{itemTypeLabel(type, lang)}</option>)}
              </select>
            </label>
            <label className="min-w-0">
              <span className="sr-only">{lang === 'en' ? 'Filter by rarity' : 'Фильтр по редкости'}</span>
              <select value={rarityFilter} onChange={(e) => setRarityFilter(e.target.value)}
                className="min-h-10 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] px-3 text-sm text-[var(--text-primary)] sm:max-w-48">
                <option value="all">{lang === 'en' ? 'All rarities' : 'Любая редкость'}</option>
                {ITEM_RARITIES.map((rarity) => <option key={rarity} value={rarity}>{itemRarityLabel(rarity, lang)}</option>)}
              </select>
            </label>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
            <span role="status" aria-live="polite">{lang === 'en' ? 'Found' : 'Найдено'}: {filteredInventory.length} / {inventory.length}</span>
            {(search || typeFilter !== 'all' || rarityFilter !== 'all') && (
              <button type="button" onClick={() => { setSearch(''); setTypeFilter('all'); setRarityFilter('all') }}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[var(--accent-text)] hover:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]">
                <X size={14} aria-hidden="true" />{lang === 'en' ? 'Clear filters' : 'Сбросить фильтры'}
              </button>
            )}
          </div>
        </section>
      )}

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
      ) : filteredInventory.length === 0 ? (
        <div role="status" className="rounded-xl border border-dashed border-[var(--border-default)] p-6 text-center text-sm text-[var(--text-muted)]">{lang === 'en' ? 'No items match these filters.' : 'По заданным фильтрам ничего не найдено.'}</div>
      ) : (
        <div className="space-y-5">
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
