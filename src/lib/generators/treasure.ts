/**
 * Treasure generator (DMG, D&D 5e).
 * Tiers: 1–4, 5–10, 11–16, 17–20.
 */

export type TreasureTier = '1-4' | '5-10' | '11-16' | '17-20'
export type Lang = 'ru' | 'en'

export interface TreasureResult {
  coins: { pp: number; gp: number; sp: number; cp: number }
  gems: string[]
  art: string[]
  magicItems: string[]
  totalValueGp: number
}

function roll(dice: number, sides: number): number {
  let total = 0
  for (let i = 0; i < dice; i++) total += Math.floor(Math.random() * sides) + 1
  return total
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
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

const COIN_TABLES: Record<
  TreasureTier,
  { cp: string; sp: string; ep: string; gp: string; pp: string }
> = {
  '1-4': { cp: '5d6', sp: '3d6', ep: '0', gp: '2d6', pp: '0' },
  '5-10': { cp: '4d6×100', sp: '6d6×10', ep: '0', gp: '3d6×10', pp: '0' },
  '11-16': { cp: '0', sp: '0', ep: '4d6×100', gp: '4d6×100', pp: '0' },
  '17-20': { cp: '0', sp: '0', ep: '0', gp: '12d6×100', pp: '8d6×10' },
}

function parseCoin(expr: string): number {
  if (expr === '0') return 0
  const match = expr.match(/^(\d+)d(\d+)(?:×(\d+))?$/)
  if (!match) return 0
  const [, dice, sides, mult] = match
  return roll(Number(dice), Number(sides)) * Number(mult ?? 1)
}

// ─── Gems ───
const GEM_TABLES: Record<
  TreasureTier,
  Array<{ value: number; namesRu: string[]; namesEn: string[] }>
> = {
  '1-4': [
    {
      value: 10,
      namesRu: ['Азурит', 'Агат', 'Кварц', 'Обсидиан', 'Тигровый глаз'],
      namesEn: ['Azurite', 'Agate', 'Quartz', 'Obsidian', 'Tiger eye'],
    },
    {
      value: 50,
      namesRu: ['Кровавый камень', 'Лазурит', 'Лунный камень', 'Турмалин'],
      namesEn: ['Bloodstone', 'Lapis lazuli', 'Moonstone', 'Tourmaline'],
    },
  ],
  '5-10': [
    {
      value: 100,
      namesRu: ['Аметист', 'Гранат', 'Жемчуг', 'Топаз'],
      namesEn: ['Amethyst', 'Garnet', 'Pearl', 'Topaz'],
    },
    {
      value: 500,
      namesRu: ['Аквамарин', 'Опал', 'Перидот'],
      namesEn: ['Aquamarine', 'Opal', 'Peridot'],
    },
  ],
  '11-16': [
    {
      value: 1000,
      namesRu: ['Изумруд', 'Сапфир', 'Рубин', 'Александрит'],
      namesEn: ['Emerald', 'Sapphire', 'Ruby', 'Alexandrite'],
    },
    {
      value: 5000,
      namesRu: ['Бриллиант', 'Чёрный опал', 'Звёздный рубин'],
      namesEn: ['Diamond', 'Black opal', 'Star ruby'],
    },
  ],
  '17-20': [
    {
      value: 10000,
      namesRu: ['Бриллиант', 'Гиацинт', 'Корунд'],
      namesEn: ['Diamond', 'Jacinth', 'Corundum'],
    },
    {
      value: 50000,
      namesRu: ['Бриллиант высшего качества', 'Рубин императора'],
      namesEn: ['Flawless diamond', "Emperor's ruby"],
    },
  ],
}

function generateGems(tier: TreasureTier, lang: Lang): { gems: string[]; value: number } {
  const count = roll(1, 4) + (tier === '1-4' ? 0 : 1)
  const gems: string[] = []
  let totalValue = 0
  for (let i = 0; i < count; i++) {
    const row = pick(GEM_TABLES[tier])
    const name = lang === 'ru' ? pick(row.namesRu) : pick(row.namesEn)
    gems.push(`${name} (${row.value} gp)`)
    totalValue += row.value
  }
  return { gems, value: totalValue }
}

// ─── Art ───
const ART_TABLES: Record<
  TreasureTier,
  Array<{ value: number; namesRu: string[]; namesEn: string[] }>
> = {
  '1-4': [
    {
      value: 25,
      namesRu: ['Серебряная статуэтка', 'Резная костяная фигурка', 'Медный кубок'],
      namesEn: ['Silver statuette', 'Carved bone figurine', 'Copper goblet'],
    },
  ],
  '5-10': [
    {
      value: 250,
      namesRu: ['Золотая статуэтка', 'Фарфоровая ваза', 'Картина маслом'],
      namesEn: ['Gold statuette', 'Porcelain vase', 'Oil painting'],
    },
  ],
  '11-16': [
    {
      value: 750,
      namesRu: ['Позолоченная статуя', 'Гобелен ручной работы', 'Изысканный гобелен'],
      namesEn: ['Gilded statue', 'Hand-woven tapestry', 'Fine tapestry'],
    },
  ],
  '17-20': [
    {
      value: 2500,
      namesRu: ['Ювелирное изделие', 'Картина великого мастера', 'Древний артефакт'],
      namesEn: ['Jeweled piece', 'Masterwork painting', 'Ancient artifact'],
    },
  ],
}

function generateArt(tier: TreasureTier, lang: Lang): { art: string[]; value: number } {
  const count = roll(1, 3)
  const art: string[] = []
  let totalValue = 0
  for (let i = 0; i < count; i++) {
    const row = pick(ART_TABLES[tier])
    const name = lang === 'ru' ? pick(row.namesRu) : pick(row.namesEn)
    art.push(`${name} (${row.value} gp)`)
    totalValue += row.value
  }
  return { art, value: totalValue }
}

// ─── Magic items ───
const MAGIC_ITEMS: Record<TreasureTier, { ru: string[]; en: string[] }> = {
  '1-4': {
    ru: ['Зелье лечения', 'Свиток (заговор)', 'Меч +1', 'Щит +1', 'Кольцо защиты'],
    en: ['Potion of Healing', 'Scroll (cantrip)', 'Sword +1', 'Shield +1', 'Ring of Protection'],
  },
  '5-10': {
    ru: [
      'Зелье большого лечения',
      'Свиток (1–3 уровень)',
      'Меч +2',
      'Плащ эльфов',
      'Сапоги эльфов',
      'Кольцо невидимости',
    ],
    en: [
      'Potion of Greater Healing',
      'Scroll (levels 1–3)',
      'Sword +2',
      'Cloak of Elvenkind',
      'Boots of Elvenkind',
      'Ring of Invisibility',
    ],
  },
  '11-16': {
    ru: [
      'Зелье превосходного лечения',
      'Свиток (4–6 уровень)',
      'Меч +3',
      'Плащ смещения',
      'Кольцо свободного действия',
    ],
    en: [
      'Potion of Superior Healing',
      'Scroll (levels 4–6)',
      'Sword +3',
      'Cloak of Displacement',
      'Ring of Free Action',
    ],
  },
  '17-20': {
    ru: [
      'Зелье высшего лечения',
      'Свиток (7–9 уровень)',
      'Меч +3 (острота)',
      'Кольцо трёх желаний',
      'Доспех +3',
    ],
    en: [
      'Potion of Supreme Healing',
      'Scroll (levels 7–9)',
      'Sword +3 (sharpness)',
      'Ring of Three Wishes',
      'Armor +3',
    ],
  },
}

function generateMagicItems(tier: TreasureTier, lang: Lang): string[] {
  const count =
    tier === '1-4'
      ? roll(1, 2)
      : tier === '5-10'
        ? roll(1, 3)
        : tier === '11-16'
          ? roll(1, 4)
          : roll(2, 4)
  return pickMany(lang === 'ru' ? MAGIC_ITEMS[tier].ru : MAGIC_ITEMS[tier].en, count)
}

export function generateTreasure(tier: TreasureTier, lang: Lang = 'ru'): TreasureResult {
  const coinTable = COIN_TABLES[tier]
  const cp = parseCoin(coinTable.cp)
  const sp = parseCoin(coinTable.sp)
  const ep = parseCoin(coinTable.ep)
  const gp = parseCoin(coinTable.gp)
  const pp = parseCoin(coinTable.pp)

  const gemResult = generateGems(tier, lang)
  const artResult = generateArt(tier, lang)
  const magicItems = generateMagicItems(tier, lang)

  const magicValue = magicItems.length * (tier === '1-4' ? 50 : tier === '5-10' ? 500 : 5000)

  const totalValueGp =
    cp / 100 + sp / 10 + ep / 2 + gp + pp * 10 + gemResult.value + artResult.value + magicValue

  return {
    coins: { pp, gp, sp, cp },
    gems: gemResult.gems,
    art: artResult.art,
    magicItems,
    totalValueGp: Math.round(totalValueGp),
  }
}
