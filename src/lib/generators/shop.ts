/**
 * Генератор магазинов по правилам DMG (D&D 5e).
 * Размер города определяет ассортимент и доступность магических предметов.
 */

export type ShopSize = 'village' | 'town' | 'city' | 'capital'

export type ShopType = 'blacksmith' | 'general' | 'alchemist' | 'magic' | 'temple' | 'tavern'

export interface ShopItem {
  name: string
  price: number // в gp
  quantity: number
  category: string
}

export interface ShopResult {
  size: ShopSize
  type: ShopType
  items: ShopItem[]
  totalValueGp: number
  description: string
}

// ─── Утилиты ───
function roll(dice: number, sides: number): number {
  let total = 0
  for (let i = 0; i < dice; i++) total += Math.floor(Math.random() * sides) + 1
  return total
}

function pickMany<T>(arr: T[], count: number): T[] {
  const result: T[] = []
  const pool = [...arr]
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length)
    result.push(pool.splice(idx, 1)[0])
  }
  return result
}

// ─── Базовые товары (общие) ───
const GENERAL_ITEMS = [
  { name: 'Факел', price: 0.01, category: 'Снаряжение' },
  { name: 'Свеча', price: 0.01, category: 'Снаряжение' },
  { name: 'Верёвка (50 футов)', price: 1, category: 'Снаряжение' },
  { name: 'Кремень и огниво', price: 0.5, category: 'Снаряжение' },
  { name: 'Мешок', price: 0.5, category: 'Снаряжение' },
  { name: 'Фляга', price: 0.05, category: 'Снаряжение' },
  { name: 'Походная еда (1 день)', price: 0.5, category: 'Снаряжение' },
  { name: 'Одеяло', price: 0.5, category: 'Снаряжение' },
  { name: 'Бумага (1 лист)', price: 0.2, category: 'Снаряжение' },
  { name: 'Чернила (1 унция)', price: 10, category: 'Снаряжение' },
]

const WEAPONS = [
  { name: 'Кинжал', price: 2, category: 'Оружие' },
  { name: 'Короткий меч', price: 10, category: 'Оружие' },
  { name: 'Длинный меч', price: 15, category: 'Оружие' },
  { name: 'Боевой топор', price: 10, category: 'Оружие' },
  { name: 'Копьё', price: 1, category: 'Оружие' },
  { name: 'Лук короткий', price: 25, category: 'Оружие' },
  { name: 'Лук длинный', price: 50, category: 'Оружие' },
  { name: 'Арбалет лёгкий', price: 25, category: 'Оружие' },
  { name: 'Дубина', price: 0.1, category: 'Оружие' },
  { name: 'Посох', price: 0.2, category: 'Оружие' },
]

const ARMOR = [
  { name: 'Кожаный доспех', price: 10, category: 'Броня' },
  { name: 'Кольчужная рубаха', price: 50, category: 'Броня' },
  { name: 'Чешуйчатый доспех', price: 50, category: 'Броня' },
  { name: 'Кираса', price: 400, category: 'Броня' },
  { name: 'Полупластинчатый доспех', price: 750, category: 'Броня' },
  { name: 'Щит', price: 10, category: 'Броня' },
]

const POTIONS = [
  { name: 'Зелье лечения', price: 50, category: 'Зелья' },
  { name: 'Зелье большого лечения', price: 150, category: 'Зелья' },
  { name: 'Зелье превосходного лечения', price: 500, category: 'Зелья' },
  { name: 'Противоядие', price: 50, category: 'Зелья' },
  { name: 'Зелье альпинизма', price: 50, category: 'Зелья' },
  { name: 'Зелье дружбы с животными', price: 50, category: 'Зелья' },
]

const MAGIC_COMMON = [
  { name: 'Зелье лечения', price: 50, category: 'Магия' },
  { name: 'Свиток (заговор)', price: 25, category: 'Магия' },
  { name: 'Кольцо защиты', price: 100, category: 'Магия' },
  { name: 'Плащ защиты', price: 100, category: 'Магия' },
]

const MAGIC_UNCOMMON = [
  { name: 'Меч +1', price: 500, category: 'Магия' },
  { name: 'Щит +1', price: 500, category: 'Магия' },
  { name: 'Плащ эльфов', price: 500, category: 'Магия' },
  { name: 'Сапоги эльфов', price: 500, category: 'Магия' },
  { name: 'Кольцо невидимости', price: 500, category: 'Магия' },
  { name: 'Свиток (1–3 уровень)', price: 100, category: 'Магия' },
]

const MAGIC_RARE = [
  { name: 'Меч +2', price: 5000, category: 'Магия' },
  { name: 'Кираса +1', price: 5000, category: 'Магия' },
  { name: 'Плащ смещения', price: 5000, category: 'Магия' },
  { name: 'Кольцо свободного действия', price: 5000, category: 'Магия' },
  { name: 'Свиток (4–6 уровень)', price: 1000, category: 'Магия' },
]

// ─── Размеры городов ───
const SIZE_CONFIG: Record<
  ShopSize,
  { label: string; general: number; weapons: number; armor: number; potions: number; magic: number }
> = {
  village: { label: 'Деревня', general: 3, weapons: 1, armor: 1, potions: 1, magic: 0 },
  town: { label: 'Городок', general: 5, weapons: 2, armor: 2, potions: 2, magic: 1 },
  city: { label: 'Город', general: 8, weapons: 4, armor: 3, potions: 3, magic: 2 },
  capital: { label: 'Столица', general: 12, weapons: 6, armor: 5, potions: 5, magic: 4 },
}

// ─── Типы магазинов ───
const SHOP_TYPES: Record<ShopType, { label: string; description: string }> = {
  blacksmith: { label: 'Кузнец', description: 'Оружие, броня, щиты' },
  general: { label: 'Общая лавка', description: 'Снаряжение, припасы' },
  alchemist: { label: 'Алхимик', description: 'Зелья, противоядия' },
  magic: { label: 'Магическая лавка', description: 'Магические предметы' },
  temple: { label: 'Храм', description: 'Зелья лечения, свитки' },
  tavern: { label: 'Таверна', description: 'Еда, напитки' },
}

// ─── Публичная функция ───
export function generateShop(size: ShopSize, type: ShopType): ShopResult {
  const config = SIZE_CONFIG[size]
  const items: ShopItem[] = []

  // 1. Общие товары
  const generalItems = pickMany(GENERAL_ITEMS, config.general)
  generalItems.forEach((item) => {
    items.push({ ...item, quantity: roll(1, 10) })
  })

  // 2. Оружие
  if (type === 'blacksmith' || type === 'general') {
    const weaponItems = pickMany(WEAPONS, config.weapons)
    weaponItems.forEach((item) => {
      items.push({ ...item, quantity: roll(1, 5) })
    })
  }

  // 3. Броня
  if (type === 'blacksmith') {
    const armorItems = pickMany(ARMOR, config.armor)
    armorItems.forEach((item) => {
      items.push({ ...item, quantity: roll(1, 3) })
    })
  }

  // 4. Зелья
  if (type === 'alchemist' || type === 'temple' || type === 'general') {
    const potionItems = pickMany(POTIONS, config.potions)
    potionItems.forEach((item) => {
      items.push({ ...item, quantity: roll(1, 5) })
    })
  }

  // 5. Магические предметы
  if (type === 'magic' || size === 'city' || size === 'capital') {
    const magicCount = config.magic
    if (magicCount > 0) {
      // Common
      const common = pickMany(MAGIC_COMMON, Math.ceil(magicCount / 3))
      common.forEach((item) => items.push({ ...item, quantity: 1 }))

      // Uncommon (только для city+)
      if (size === 'city' || size === 'capital') {
        const uncommon = pickMany(MAGIC_UNCOMMON, Math.floor(magicCount / 2))
        uncommon.forEach((item) => items.push({ ...item, quantity: 1 }))
      }

      // Rare (только для capital)
      if (size === 'capital') {
        const rare = pickMany(MAGIC_RARE, Math.floor(magicCount / 3))
        rare.forEach((item) => items.push({ ...item, quantity: 1 }))
      }
    }
  }

  const totalValueGp = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shopInfo = SHOP_TYPES[type]

  return {
    size,
    type,
    items,
    totalValueGp: Math.round(totalValueGp),
    description: `${shopInfo.label} (${config.label}): ${shopInfo.description}`,
  }
}
