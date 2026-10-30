import type { SrdLang } from '@/lib/types'

// Display labels only: keep the exact retained category for filters and imports.
const categories = [
  ['Adventuring Gear', 'Приключенческое снаряжение'],
  ['Ammunition', 'Боеприпасы'],
  ['Armor', 'Доспехи'],
  ['Equipment Pack', 'Набор снаряжения'],
  ['Land Vehicle', 'Наземный транспорт'],
  ['Mount', 'Верховое животное'],
  ['Poison', 'Яд'],
  ['Potion', 'Зелье'],
  ['Ring', 'Кольцо'],
  ['Rod', 'Жезл'],
  ['Scroll', 'Свиток'],
  ['Shield', 'Щит'],
  ['Spellcasting Focus', 'Магическая фокусировка'],
  ['Staff', 'Посох'],
  ['Tools', 'Инструменты'],
  ['Trade Good', 'Торговые товары'],
  ['Wand', 'Волшебная палочка'],
  ['Waterborne Vehicle', 'Водный транспорт'],
  ['Weapon', 'Оружие'],
  ['Wondrous Item', 'Чудесный предмет'],
] as const

const labels = new Map<string, { ru: string; en: string }>(
  categories.map(([en, ru]) => [en.toLowerCase(), { ru, en }])
)

export function srdItemTypeLabel(value: unknown, lang: SrdLang): string {
  if (typeof value !== 'string') return ''
  const key = value.trim().replace(/\s+/g, ' ').toLowerCase()
  return labels.get(key)?.[lang] ?? value
}
