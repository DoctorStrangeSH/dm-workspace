/**
 * Генератор сокровищ по правилам DMG (D&D 5e).
 * Уровни: 1–4, 5–10, 11–16, 17–20.
 * Типы: монеты, драгоценности, предметы искусства, магические предметы.
 */

export type TreasureTier = '1-4' | '5-10' | '11-16' | '17-20'

export interface TreasureResult {
  coins: { pp: number; gp: number; sp: number; cp: number }
  gems: string[]
  art: string[]
  magicItems: string[]
  totalValueGp: number
}

// ─── Утилиты ───
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

// ─── Таблицы монет (DMG) ───
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

// ─── Драгоценности (d100) ───
const GEM_TABLES: Record<TreasureTier, Array<{ value: number; names: string[] }>> = {
  '1-4': [
    { value: 10, names: ['Азурит', 'Агат', 'Кварц', 'Обсидиан', 'Тигровый глаз'] },
    { value: 50, names: ['Кровавый камень', 'Лазурит', 'Лунный камень', 'Турмалин'] },
  ],
  '5-10': [
    { value: 100, names: ['Аметист', 'Гранат', 'Жемчуг', 'Топаз'] },
    { value: 500, names: ['Аквамарин', 'Опал', 'Перидот'] },
  ],
  '11-16': [
    { value: 1000, names: ['Изумруд', 'Сапфир', 'Рубин', 'Александрит'] },
    { value: 5000, names: ['Бриллиант', 'Чёрный опал', 'Звёздный рубин'] },
  ],
  '17-20': [
    { value: 10000, names: ['Бриллиант', 'Гиацинт', 'Корунд'] },
    { value: 50000, names: ['Бриллиант высшего качества', 'Рубин императора'] },
  ],
}

function generateGems(tier: TreasureTier): { gems: string[]; value: number } {
  const count = roll(1, 4) + (tier === '1-4' ? 0 : 1)
  const gems: string[] = []
  let totalValue = 0
  for (let i = 0; i < count; i++) {
    const row = pick(GEM_TABLES[tier])
    const name = pick(row.names)
    gems.push(`${name} (${row.value} gp)`)
    totalValue += row.value
  }
  return { gems, value: totalValue }
}

// ─── Предметы искусства (d100) ───
const ART_TABLES: Record<TreasureTier, Array<{ value: number; names: string[] }>> = {
  '1-4': [
    { value: 25, names: ['Серебряная статуэтка', 'Резная костяная фигурка', 'Медный кубок'] },
  ],
  '5-10': [{ value: 250, names: ['Золотая статуэтка', 'Фарфоровая ваза', 'Картина маслом'] }],
  '11-16': [
    { value: 750, names: ['Позолоченная статуя', 'Гобелен ручной работы', 'Изысканный гобелен'] },
  ],
  '17-20': [
    { value: 2500, names: ['Ювелирное изделие', 'Картина великого мастера', 'Древний артефакт'] },
  ],
}

function generateArt(tier: TreasureTier): { art: string[]; value: number } {
  const count = roll(1, 3)
  const art: string[] = []
  let totalValue = 0
  for (let i = 0; i < count; i++) {
    const row = pick(ART_TABLES[tier])
    const name = pick(row.names)
    art.push(`${name} (${row.value} gp)`)
    totalValue += row.value
  }
  return { art, value: totalValue }
}

// ─── Магические предметы (краткий список) ───
const MAGIC_ITEMS: Record<TreasureTier, string[]> = {
  '1-4': ['Зелье лечения', 'Свиток (заговор)', 'Меч +1', 'Щит +1', 'Кольцо защиты'],
  '5-10': [
    'Зелье большого лечения',
    'Свиток (1–3 уровень)',
    'Меч +2',
    'Плащ эльфов',
    'Сапоги эльфов',
    'Кольцо невидимости',
  ],
  '11-16': [
    'Зелье превосходного лечения',
    'Свиток (4–6 уровень)',
    'Меч +3',
    'Плащ смещения',
    'Кольцо свободного действия',
  ],
  '17-20': [
    'Зелье высшего лечения',
    'Свиток (7–9 уровень)',
    'Меч +3 (острота)',
    'Кольцо трёх желаний',
    'Доспех +3',
  ],
}

function generateMagicItems(tier: TreasureTier): string[] {
  const count =
    tier === '1-4'
      ? roll(1, 2)
      : tier === '5-10'
        ? roll(1, 3)
        : tier === '11-16'
          ? roll(1, 4)
          : roll(2, 4)
  return pickMany(MAGIC_ITEMS[tier], count)
}

// ─── Публичная функция ───
export function generateTreasure(tier: TreasureTier): TreasureResult {
  const coinTable = COIN_TABLES[tier]

  const cp = parseCoin(coinTable.cp)
  const sp = parseCoin(coinTable.sp)
  const ep = parseCoin(coinTable.ep)
  const gp = parseCoin(coinTable.gp)
  const pp = parseCoin(coinTable.pp)

  const gemResult = generateGems(tier)
  const artResult = generateArt(tier)
  const magicItems = generateMagicItems(tier)

  // Примерная стоимость магических предметов (для totalValueGp)
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
