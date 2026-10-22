/**
 * Генератор энкаунтеров по правилам DMG (D&D 5e).
 * Биом + уровень партии → список монстров + описание.
 */

export type EncounterBiome =
  'forest' | 'mountains' | 'swamp' | 'desert' | 'dungeon' | 'city' | 'sea' | 'plains'

export type EncounterTier = '1-4' | '5-10' | '11-16' | '17-20'

export type EncounterDifficulty = 'easy' | 'medium' | 'hard' | 'deadly'

export interface EncounterMonster {
  name: string
  cr: string
  count: number
}

export interface EncounterResult {
  biome: EncounterBiome
  tier: EncounterTier
  difficulty: EncounterDifficulty
  monsters: EncounterMonster[]
  description: string
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

// ─── Монстры по биомам и уровням ───
// (краткий список для генератора, полный — в SRD)
const MONSTERS_BY_BIOME: Record<
  EncounterBiome,
  Record<EncounterTier, Array<{ name: string; cr: string }>>
> = {
  forest: {
    '1-4': [
      { name: 'Волк', cr: '1/4' },
      { name: 'Гоблин', cr: '1/4' },
      { name: 'Гигантская крыса', cr: '1/8' },
      { name: 'Медведь', cr: '1' },
    ],
    '5-10': [
      { name: 'Эттин', cr: '4' },
      { name: 'Тролль', cr: '5' },
      { name: 'Гигантский паук', cr: '1' },
    ],
    '11-16': [
      { name: 'Треант', cr: '9' },
      { name: 'Молодой зелёный дракон', cr: '8' },
    ],
    '17-20': [
      { name: 'Взрослый зелёный дракон', cr: '15' },
      { name: 'Древний треант', cr: '16' },
    ],
  },
  mountains: {
    '1-4': [
      { name: 'Орк', cr: '1/2' },
      { name: 'Кобольд', cr: '1/8' },
      { name: 'Горный лев', cr: '1' },
    ],
    '5-10': [
      { name: 'Огр', cr: '2' },
      { name: 'Грифон', cr: '2' },
      { name: 'Эттин', cr: '4' },
    ],
    '11-16': [
      { name: 'Каменный гигант', cr: '7' },
      { name: 'Взрослый синий дракон', cr: '14' },
    ],
    '17-20': [
      { name: 'Древний синий дракон', cr: '23' },
      { name: 'Штормовой гигант', cr: '13' },
    ],
  },
  swamp: {
    '1-4': [
      { name: 'Ядовитая змея', cr: '1/8' },
      { name: 'Гоблин', cr: '1/4' },
      { name: 'Крокодил', cr: '1/2' },
    ],
    '5-10': [
      { name: 'Тролль', cr: '5' },
      { name: 'Гидра', cr: '8' },
    ],
    '11-16': [
      { name: 'Чёрный дракон (молодой)', cr: '7' },
      { name: 'Болотный тролль', cr: '5' },
    ],
    '17-20': [
      { name: 'Взрослый чёрный дракон', cr: '14' },
      { name: 'Древний чёрный дракон', cr: '21' },
    ],
  },
  desert: {
    '1-4': [
      { name: 'Скорпион', cr: '0' },
      { name: 'Гоблин', cr: '1/4' },
      { name: 'Гиена', cr: '0' },
    ],
    '5-10': [
      { name: 'Мумия', cr: '3' },
      { name: 'Гигантский скорпион', cr: '3' },
    ],
    '11-16': [
      { name: 'Синий дракон (молодой)', cr: '9' },
      { name: 'Сфинкс', cr: '11' },
    ],
    '17-20': [
      { name: 'Древний синий дракон', cr: '23' },
      { name: 'Сфинкс (андросфинкс)', cr: '17' },
    ],
  },
  dungeon: {
    '1-4': [
      { name: 'Крыса', cr: '0' },
      { name: 'Гоблин', cr: '1/4' },
      { name: 'Кобольд', cr: '1/8' },
      { name: 'Скелет', cr: '1/4' },
    ],
    '5-10': [
      { name: 'Мимик', cr: '2' },
      { name: 'Огр', cr: '2' },
      { name: 'Тролль', cr: '5' },
      { name: 'Мумия', cr: '3' },
    ],
    '11-16': [
      { name: 'Бихолдер', cr: '13' },
      { name: 'Тролль (полый)', cr: '5' },
      { name: 'Вампир', cr: '13' },
    ],
    '17-20': [
      { name: 'Демилич', cr: '18' },
      { name: 'Древний красный дракон', cr: '24' },
    ],
  },
  city: {
    '1-4': [
      { name: 'Бандит', cr: '1/8' },
      { name: 'Гоблин', cr: '1/4' },
      { name: 'Крыса', cr: '0' },
    ],
    '5-10': [
      { name: 'Бандит-капитан', cr: '2' },
      { name: 'Огр', cr: '2' },
      { name: 'Доппельгангер', cr: '3' },
    ],
    '11-16': [
      { name: 'Ассасин', cr: '8' },
      { name: 'Маг', cr: '6' },
    ],
    '17-20': [
      { name: 'Архимаг', cr: '12' },
      { name: 'Вампир', cr: '13' },
    ],
  },
  sea: {
    '1-4': [
      { name: 'Краб', cr: '0' },
      { name: 'Морская змея', cr: '1/8' },
      { name: 'Пират', cr: '1/8' },
    ],
    '5-10': [
      { name: 'Сахуагин', cr: '1/2' },
      { name: 'Гигантский краб', cr: '1/2' },
      { name: 'Морской тролль', cr: '5' },
    ],
    '11-16': [
      { name: 'Аболет', cr: '10' },
      { name: 'Морской змей', cr: '5' },
    ],
    '17-20': [
      { name: 'Кракен', cr: '23' },
      { name: 'Древний бронзовый дракон', cr: '22' },
    ],
  },
  plains: {
    '1-4': [
      { name: 'Гоблин', cr: '1/4' },
      { name: 'Волк', cr: '1/4' },
      { name: 'Лошадь', cr: '1/8' },
    ],
    '5-10': [
      { name: 'Бурый медведь', cr: '1' },
      { name: 'Лев', cr: '1' },
      { name: 'Огр', cr: '2' },
    ],
    '11-16': [
      { name: 'Мамонт', cr: '6' },
      { name: 'Великан', cr: '6' },
    ],
    '17-20': [
      { name: 'Древний медный дракон', cr: '21' },
      { name: 'Титан', cr: '23' },
    ],
  },
}

// ─── Описания сцен ───
const SCENE_DESCRIPTIONS: Record<EncounterBiome, string[]> = {
  forest: [
    'Тенистые деревья смыкаются над головой, слышен хруст веток.',
    'Лесная поляна, залитая лунным светом, но что-то шевелится в кустах.',
    'Густой подлесок, где каждый шаг отдаётся эхом.',
  ],
  mountains: [
    'Узкая тропа над пропастью, ветер сбивает с ног.',
    'Камнепад только что прошёл — пыль ещё висит в воздухе.',
    'Снежный перевал, где видимость почти нулевая.',
  ],
  swamp: [
    'Мутная вода по колено, пузыри поднимаются на поверхность.',
    'Кривые деревья, увитые лианами, и запах гнили.',
    'Туман над болотом, и странные огни вдалеке.',
  ],
  desert: [
    'Палящее солнце, песок скрипит на зубах.',
    'Барханы, и вдруг — тень на горизонте.',
    'Оазис впереди, но что-то не так с водой.',
  ],
  dungeon: [
    'Сырые каменные стены, факелы почти догорели.',
    'Коридор разветвляется, и из темноты слышно дыхание.',
    'Заброшенный зал, где эхо шагов звучит слишком громко.',
  ],
  city: [
    'Тёмный переулок, где фонари не достают до земли.',
    'Шумный рынок, но кто-то следит из толпы.',
    'Крыши, по которым можно уйти от погони.',
  ],
  sea: [
    'Шторм набирает силу, палуба уходит из-под ног.',
    'Туман над водой, и силуэты в нём.',
    'Остров впереди — но он не на карте.',
  ],
  plains: [
    'Бескрайняя степь, и только ветер в траве.',
    'Заброшенная ферма, где давно не ступала нога человека.',
    'Стадо вдалеке, но оно движется слишком быстро.',
  ],
}

// ─── Сложность ───
function calculateDifficulty(tier: EncounterTier, monsterCount: number): EncounterDifficulty {
  const roll = Math.random()
  if (tier === '1-4') {
    if (monsterCount <= 1) return roll < 0.6 ? 'easy' : 'medium'
    return roll < 0.4 ? 'medium' : roll < 0.8 ? 'hard' : 'deadly'
  }
  if (tier === '5-10') {
    if (monsterCount <= 1) return roll < 0.5 ? 'medium' : 'hard'
    return roll < 0.4 ? 'hard' : 'deadly'
  }
  return roll < 0.3 ? 'medium' : roll < 0.7 ? 'hard' : 'deadly'
}

// ─── Публичная функция ───
export function generateEncounter(biome: EncounterBiome, tier: EncounterTier): EncounterResult {
  const monstersPool = MONSTERS_BY_BIOME[biome][tier]
  const count = roll(1, 3) // 1–3 типа монстров
  const selected = pickMany(monstersPool, Math.min(count, monstersPool.length))

  const monsters: EncounterMonster[] = selected.map((m) => ({
    name: m.name,
    cr: m.cr,
    count: roll(1, 4),
  }))

  const totalCount = monsters.reduce((sum, m) => sum + m.count, 0)
  const difficulty = calculateDifficulty(tier, totalCount)
  const description = pick(SCENE_DESCRIPTIONS[biome])

  return {
    biome,
    tier,
    difficulty,
    monsters,
    description,
  }
}
