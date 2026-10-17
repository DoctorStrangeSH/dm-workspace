import * as dndData from 'dnd-data'

const ALLOWED_BOOK_PATTERNS = [
  '2024',
  'SRD',
  'Systems Reference',
  "Player's Handbook",
  "Dungeon Master's Guide",
  'Monster Manual',
]

function isAllowed(item: any): boolean {
  const book = item.book ?? ''
  return ALLOWED_BOOK_PATTERNS.some((pattern) =>
    book.toLowerCase().includes(pattern.toLowerCase())
  )
}

function count(items: any[], name: string) {
  const allowed = items.filter(isAllowed)
  const unique = new Map<string, any>()
  for (const item of allowed) {
    const key = `${item.name?.toLowerCase()}_${item.book ?? ''}`
    if (!unique.has(key)) unique.set(key, item)
  }
  console.log(
    `${name}: ${allowed.length} / ${items.length} (уникальных: ${unique.size})`
  )
}

console.log('📊 Фильтр "2024 + SRD":\n')
count(dndData.species, 'Species    ')
count(dndData.classes, 'Classes    ')
count(dndData.backgrounds, 'Backgrounds')
count(dndData.monsters, 'Monsters   ')
count(dndData.spells, 'Spells     ')
count(dndData.items, 'Items      ')