export const ITEM_TYPES = ['weapon', 'armor', 'consumable', 'tool', 'wondrous', 'other'] as const
export const ITEM_RARITIES = ['common', 'uncommon', 'rare', 'very_rare', 'legendary', 'artifact'] as const
export type ItemType = (typeof ITEM_TYPES)[number]
export type ItemRarity = (typeof ITEM_RARITIES)[number]
type Language = 'ru' | 'en'

const labels: Record<Language, { types: Record<ItemType, string>; rarities: Record<ItemRarity, string> }> = {
  ru: {
    types: { weapon: 'Оружие', armor: 'Доспех', consumable: 'Расходник', tool: 'Инструмент', wondrous: 'Чудесный предмет', other: 'Прочее' },
    rarities: { common: 'Обычный', uncommon: 'Необычный', rare: 'Редкий', very_rare: 'Очень редкий', legendary: 'Легендарный', artifact: 'Артефакт' },
  },
  en: {
    types: { weapon: 'Weapon', armor: 'Armor', consumable: 'Consumable', tool: 'Tool', wondrous: 'Wondrous item', other: 'Other' },
    rarities: { common: 'Common', uncommon: 'Uncommon', rare: 'Rare', very_rare: 'Very rare', legendary: 'Legendary', artifact: 'Artifact' },
  },
}

export function itemTypeLabel(value: string | undefined, lang: Language): string | null {
  return ITEM_TYPES.includes(value as ItemType) ? labels[lang].types[value as ItemType] : null
}

export function itemRarityLabel(value: string | undefined, lang: Language): string | null {
  return ITEM_RARITIES.includes(value as ItemRarity) ? labels[lang].rarities[value as ItemRarity] : null
}

export function itemRarityClass(value: string | undefined): string {
  switch (value) {
    case 'uncommon': return 'border-emerald-500/35 text-emerald-600 dark:text-emerald-400'
    case 'rare': return 'border-blue-500/35 text-blue-600 dark:text-blue-400'
    case 'very_rare': return 'border-violet-500/35 text-violet-600 dark:text-violet-400'
    case 'legendary': return 'border-amber-500/35 text-amber-600 dark:text-amber-400'
    case 'artifact': return 'border-rose-500/35 text-rose-600 dark:text-rose-400'
    default: return 'border-[var(--border-default)] text-[var(--text-muted)]'
  }
}
