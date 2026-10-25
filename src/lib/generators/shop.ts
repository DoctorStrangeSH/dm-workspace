/**
 * Shop generator (DMG, D&D 5e).
 * Settlement size → assortment and magic item availability.
 */

export type ShopSize = 'village' | 'town' | 'city' | 'capital'
export type ShopType = 'blacksmith' | 'general' | 'alchemist' | 'magic' | 'temple' | 'tavern'
export type Lang = 'ru' | 'en'

export interface ShopItem {
  name: string
  price: number
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

function L(lang: Lang, ru: string, en: string): string {
  return lang === 'ru' ? ru : en
}

type ItemDef = { nameRu: string; nameEn: string; price: number; catRu: string; catEn: string }

const GENERAL_ITEMS: ItemDef[] = [
  { nameRu: 'Факел', nameEn: 'Torch', price: 0.01, catRu: 'Снаряжение', catEn: 'Equipment' },
  { nameRu: 'Свеча', nameEn: 'Candle', price: 0.01, catRu: 'Снаряжение', catEn: 'Equipment' },
  {
    nameRu: 'Верёвка (50 футов)',
    nameEn: 'Rope (50 ft)',
    price: 1,
    catRu: 'Снаряжение',
    catEn: 'Equipment',
  },
  {
    nameRu: 'Кремень и огниво',
    nameEn: 'Flint and steel',
    price: 0.5,
    catRu: 'Снаряжение',
    catEn: 'Equipment',
  },
  { nameRu: 'Мешок', nameEn: 'Sack', price: 0.5, catRu: 'Снаряжение', catEn: 'Equipment' },
  { nameRu: 'Фляга', nameEn: 'Waterskin', price: 0.05, catRu: 'Снаряжение', catEn: 'Equipment' },
  {
    nameRu: 'Походная еда (1 день)',
    nameEn: 'Rations (1 day)',
    price: 0.5,
    catRu: 'Снаряжение',
    catEn: 'Equipment',
  },
  { nameRu: 'Одеяло', nameEn: 'Blanket', price: 0.5, catRu: 'Снаряжение', catEn: 'Equipment' },
  {
    nameRu: 'Бумага (1 лист)',
    nameEn: 'Paper (sheet)',
    price: 0.2,
    catRu: 'Снаряжение',
    catEn: 'Equipment',
  },
  {
    nameRu: 'Чернила (1 унция)',
    nameEn: 'Ink (1 oz)',
    price: 10,
    catRu: 'Снаряжение',
    catEn: 'Equipment',
  },
]

const WEAPONS: ItemDef[] = [
  { nameRu: 'Кинжал', nameEn: 'Dagger', price: 2, catRu: 'Оружие', catEn: 'Weapon' },
  { nameRu: 'Короткий меч', nameEn: 'Shortsword', price: 10, catRu: 'Оружие', catEn: 'Weapon' },
  { nameRu: 'Длинный меч', nameEn: 'Longsword', price: 15, catRu: 'Оружие', catEn: 'Weapon' },
  { nameRu: 'Боевой топор', nameEn: 'Battleaxe', price: 10, catRu: 'Оружие', catEn: 'Weapon' },
  { nameRu: 'Копьё', nameEn: 'Spear', price: 1, catRu: 'Оружие', catEn: 'Weapon' },
  { nameRu: 'Лук короткий', nameEn: 'Shortbow', price: 25, catRu: 'Оружие', catEn: 'Weapon' },
  { nameRu: 'Лук длинный', nameEn: 'Longbow', price: 50, catRu: 'Оружие', catEn: 'Weapon' },
  {
    nameRu: 'Арбалет лёгкий',
    nameEn: 'Light crossbow',
    price: 25,
    catRu: 'Оружие',
    catEn: 'Weapon',
  },
  { nameRu: 'Дубина', nameEn: 'Club', price: 0.1, catRu: 'Оружие', catEn: 'Weapon' },
  { nameRu: 'Посох', nameEn: 'Quarterstaff', price: 0.2, catRu: 'Оружие', catEn: 'Weapon' },
]

const ARMOR: ItemDef[] = [
  { nameRu: 'Кожаный доспех', nameEn: 'Leather armor', price: 10, catRu: 'Броня', catEn: 'Armor' },
  { nameRu: 'Кольчужная рубаха', nameEn: 'Chain shirt', price: 50, catRu: 'Броня', catEn: 'Armor' },
  { nameRu: 'Чешуйчатый доспех', nameEn: 'Scale mail', price: 50, catRu: 'Броня', catEn: 'Armor' },
  { nameRu: 'Кираса', nameEn: 'Breastplate', price: 400, catRu: 'Броня', catEn: 'Armor' },
  {
    nameRu: 'Полупластинчатый доспех',
    nameEn: 'Half plate',
    price: 750,
    catRu: 'Броня',
    catEn: 'Armor',
  },
  { nameRu: 'Щит', nameEn: 'Shield', price: 10, catRu: 'Броня', catEn: 'Armor' },
]

const POTIONS: ItemDef[] = [
  {
    nameRu: 'Зелье лечения',
    nameEn: 'Potion of Healing',
    price: 50,
    catRu: 'Зелья',
    catEn: 'Potions',
  },
  {
    nameRu: 'Зелье большого лечения',
    nameEn: 'Potion of Greater Healing',
    price: 150,
    catRu: 'Зелья',
    catEn: 'Potions',
  },
  {
    nameRu: 'Зелье превосходного лечения',
    nameEn: 'Potion of Superior Healing',
    price: 500,
    catRu: 'Зелья',
    catEn: 'Potions',
  },
  { nameRu: 'Противоядие', nameEn: 'Antitoxin', price: 50, catRu: 'Зелья', catEn: 'Potions' },
  {
    nameRu: 'Зелье альпинизма',
    nameEn: 'Potion of Climbing',
    price: 50,
    catRu: 'Зелья',
    catEn: 'Potions',
  },
  {
    nameRu: 'Зелье дружбы с животными',
    nameEn: 'Potion of Animal Friendship',
    price: 50,
    catRu: 'Зелья',
    catEn: 'Potions',
  },
]

const MAGIC_COMMON: ItemDef[] = [
  {
    nameRu: 'Зелье лечения',
    nameEn: 'Potion of Healing',
    price: 50,
    catRu: 'Магия',
    catEn: 'Magic',
  },
  {
    nameRu: 'Свиток (заговор)',
    nameEn: 'Scroll (cantrip)',
    price: 25,
    catRu: 'Магия',
    catEn: 'Magic',
  },
  {
    nameRu: 'Кольцо защиты',
    nameEn: 'Ring of Protection',
    price: 100,
    catRu: 'Магия',
    catEn: 'Magic',
  },
  {
    nameRu: 'Плащ защиты',
    nameEn: 'Cloak of Protection',
    price: 100,
    catRu: 'Магия',
    catEn: 'Magic',
  },
]

const MAGIC_UNCOMMON: ItemDef[] = [
  { nameRu: 'Меч +1', nameEn: 'Sword +1', price: 500, catRu: 'Магия', catEn: 'Magic' },
  { nameRu: 'Щит +1', nameEn: 'Shield +1', price: 500, catRu: 'Магия', catEn: 'Magic' },
  {
    nameRu: 'Плащ эльфов',
    nameEn: 'Cloak of Elvenkind',
    price: 500,
    catRu: 'Магия',
    catEn: 'Magic',
  },
  {
    nameRu: 'Сапоги эльфов',
    nameEn: 'Boots of Elvenkind',
    price: 500,
    catRu: 'Магия',
    catEn: 'Magic',
  },
  {
    nameRu: 'Кольцо невидимости',
    nameEn: 'Ring of Invisibility',
    price: 500,
    catRu: 'Магия',
    catEn: 'Magic',
  },
  {
    nameRu: 'Свиток (1–3 уровень)',
    nameEn: 'Scroll (levels 1–3)',
    price: 100,
    catRu: 'Магия',
    catEn: 'Magic',
  },
]

const MAGIC_RARE: ItemDef[] = [
  { nameRu: 'Меч +2', nameEn: 'Sword +2', price: 5000, catRu: 'Магия', catEn: 'Magic' },
  { nameRu: 'Кираса +1', nameEn: 'Breastplate +1', price: 5000, catRu: 'Магия', catEn: 'Magic' },
  {
    nameRu: 'Плащ смещения',
    nameEn: 'Cloak of Displacement',
    price: 5000,
    catRu: 'Магия',
    catEn: 'Magic',
  },
  {
    nameRu: 'Кольцо свободного действия',
    nameEn: 'Ring of Free Action',
    price: 5000,
    catRu: 'Магия',
    catEn: 'Magic',
  },
  {
    nameRu: 'Свиток (4–6 уровень)',
    nameEn: 'Scroll (levels 4–6)',
    price: 1000,
    catRu: 'Магия',
    catEn: 'Magic',
  },
]

const SIZE_CONFIG: Record<
  ShopSize,
  {
    ru: string
    en: string
    general: number
    weapons: number
    armor: number
    potions: number
    magic: number
  }
> = {
  village: { ru: 'Деревня', en: 'Village', general: 3, weapons: 1, armor: 1, potions: 1, magic: 0 },
  town: { ru: 'Городок', en: 'Town', general: 5, weapons: 2, armor: 2, potions: 2, magic: 1 },
  city: { ru: 'Город', en: 'City', general: 8, weapons: 4, armor: 3, potions: 3, magic: 2 },
  capital: {
    ru: 'Столица',
    en: 'Capital',
    general: 12,
    weapons: 6,
    armor: 5,
    potions: 5,
    magic: 4,
  },
}

const SHOP_TYPES: Record<
  ShopType,
  { labelRu: string; labelEn: string; descRu: string; descEn: string }
> = {
  blacksmith: {
    labelRu: 'Кузнец',
    labelEn: 'Blacksmith',
    descRu: 'Оружие, броня, щиты',
    descEn: 'Weapons, armor, shields',
  },
  general: {
    labelRu: 'Общая лавка',
    labelEn: 'General store',
    descRu: 'Снаряжение, припасы',
    descEn: 'Equipment, supplies',
  },
  alchemist: {
    labelRu: 'Алхимик',
    labelEn: 'Alchemist',
    descRu: 'Зелья, противоядия',
    descEn: 'Potions, antitoxins',
  },
  magic: {
    labelRu: 'Магическая лавка',
    labelEn: 'Magic shop',
    descRu: 'Магические предметы',
    descEn: 'Magic items',
  },
  temple: {
    labelRu: 'Храм',
    labelEn: 'Temple',
    descRu: 'Зелья лечения, свитки',
    descEn: 'Healing potions, scrolls',
  },
  tavern: { labelRu: 'Таверна', labelEn: 'Tavern', descRu: 'Еда, напитки', descEn: 'Food, drinks' },
}

function toItem(lang: Lang, def: ItemDef, quantity: number): ShopItem {
  return {
    name: L(lang, def.nameRu, def.nameEn),
    price: def.price,
    quantity,
    category: L(lang, def.catRu, def.catEn),
  }
}

export function generateShop(size: ShopSize, type: ShopType, lang: Lang = 'ru'): ShopResult {
  const config = SIZE_CONFIG[size]
  const items: ShopItem[] = []

  pickMany(GENERAL_ITEMS, config.general).forEach((item) => {
    items.push(toItem(lang, item, roll(1, 10)))
  })

  if (type === 'blacksmith' || type === 'general') {
    pickMany(WEAPONS, config.weapons).forEach((item) => {
      items.push(toItem(lang, item, roll(1, 5)))
    })
  }

  if (type === 'blacksmith') {
    pickMany(ARMOR, config.armor).forEach((item) => {
      items.push(toItem(lang, item, roll(1, 3)))
    })
  }

  if (type === 'alchemist' || type === 'temple' || type === 'general') {
    pickMany(POTIONS, config.potions).forEach((item) => {
      items.push(toItem(lang, item, roll(1, 5)))
    })
  }

  if (type === 'magic' || size === 'city' || size === 'capital') {
    const magicCount = config.magic
    if (magicCount > 0) {
      pickMany(MAGIC_COMMON, Math.ceil(magicCount / 3)).forEach((item) => {
        items.push(toItem(lang, item, 1))
      })
      if (size === 'city' || size === 'capital') {
        pickMany(MAGIC_UNCOMMON, Math.floor(magicCount / 2)).forEach((item) => {
          items.push(toItem(lang, item, 1))
        })
      }
      if (size === 'capital') {
        pickMany(MAGIC_RARE, Math.floor(magicCount / 3)).forEach((item) => {
          items.push(toItem(lang, item, 1))
        })
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
    description: `${L(lang, shopInfo.labelRu, shopInfo.labelEn)} (${L(lang, config.ru, config.en)}): ${L(lang, shopInfo.descRu, shopInfo.descEn)}`,
  }
}
