import type { ItemRarity, ItemType } from './inventory-metadata'

// Catalog categories are broader than the character inventory's six display categories.
// Unmapped categories stay Other; category alone never grants magical properties.
const types = new Map<string, ItemType>([
  ['weapon', 'weapon'],
  ['armor', 'armor'],
  ['shield', 'armor'],
  ['consumable', 'consumable'],
  ['ammunition', 'consumable'],
  ['potion', 'consumable'],
  ['poison', 'consumable'],
  ['scroll', 'consumable'],
  ['tool', 'tool'],
  ['tools', 'tool'],
  ['wondrous', 'wondrous'],
  ['wondrous item', 'wondrous'],
  ['other', 'other'],
])

const rarities = new Map<string, ItemRarity>([
  ['common', 'common'],
  ['uncommon', 'uncommon'],
  ['rare', 'rare'],
  ['very rare', 'very_rare'],
  ['legendary', 'legendary'],
  ['artifact', 'artifact'],
])

function normalized(value: unknown): string {
  return typeof value === 'string'
    ? value
        .trim()
        .toLowerCase()
        .replace(/[\s_-]+/g, ' ')
    : ''
}

export function srdInventoryMetadata(data: unknown): { itemType: ItemType; rarity?: ItemRarity } {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return { itemType: 'other' }
  const record = data as Record<string, unknown>
  const itemType = types.get(normalized(record.item_type)) ?? 'other'
  const rarity = rarities.get(normalized(record.rarity))
  // An unknown source rarity must not become an invented saved rarity.
  return { itemType, ...(rarity ? { rarity } : {}) }
}
