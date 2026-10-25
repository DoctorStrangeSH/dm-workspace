/**
 * Encounter generator (DMG, D&D 5e).
 * Biome + party tier → monster list + description.
 */

export type EncounterBiome =
  'forest' | 'mountains' | 'swamp' | 'desert' | 'dungeon' | 'city' | 'sea' | 'plains'

export type EncounterTier = '1-4' | '5-10' | '11-16' | '17-20'

export type EncounterDifficulty = 'easy' | 'medium' | 'hard' | 'deadly'

export type Lang = 'ru' | 'en'

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

// ─── Utils ───
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

function L(lang: Lang, ru: string, en: string): string {
  return lang === 'ru' ? ru : en
}

// ─── Monsters by biome + tier (name + CR only) ───
// CHANGES (К8): monster names are bilingual.
const MONSTERS_BY_BIOME: Record<
  EncounterBiome,
  Record<EncounterTier, Array<{ nameRu: string; nameEn: string; cr: string }>>
> = {
  forest: {
    '1-4': [
      { nameRu: 'Волк', nameEn: 'Wolf', cr: '1/4' },
      { nameRu: 'Гоблин', nameEn: 'Goblin', cr: '1/4' },
      { nameRu: 'Гигантская крыса', nameEn: 'Giant Rat', cr: '1/8' },
      { nameRu: 'Медведь', nameEn: 'Bear', cr: '1' },
    ],
    '5-10': [
      { nameRu: 'Эттин', nameEn: 'Ettin', cr: '4' },
      { nameRu: 'Тролль', nameEn: 'Troll', cr: '5' },
      { nameRu: 'Гигантский паук', nameEn: 'Giant Spider', cr: '1' },
    ],
    '11-16': [
      { nameRu: 'Треант', nameEn: 'Treant', cr: '9' },
      { nameRu: 'Молодой зелёный дракон', nameEn: 'Young Green Dragon', cr: '8' },
    ],
    '17-20': [
      { nameRu: 'Взрослый зелёный дракон', nameEn: 'Adult Green Dragon', cr: '15' },
      { nameRu: 'Древний треант', nameEn: 'Ancient Treant', cr: '16' },
    ],
  },
  mountains: {
    '1-4': [
      { nameRu: 'Орк', nameEn: 'Orc', cr: '1/2' },
      { nameRu: 'Кобольд', nameEn: 'Kobold', cr: '1/8' },
      { nameRu: 'Горный лев', nameEn: 'Mountain Lion', cr: '1' },
    ],
    '5-10': [
      { nameRu: 'Огр', nameEn: 'Ogre', cr: '2' },
      { nameRu: 'Грифон', nameEn: 'Griffon', cr: '2' },
      { nameRu: 'Эттин', nameEn: 'Ettin', cr: '4' },
    ],
    '11-16': [
      { nameRu: 'Каменный гигант', nameEn: 'Stone Giant', cr: '7' },
      { nameRu: 'Взрослый синий дракон', nameEn: 'Adult Blue Dragon', cr: '14' },
    ],
    '17-20': [
      { nameRu: 'Древний синий дракон', nameEn: 'Ancient Blue Dragon', cr: '23' },
      { nameRu: 'Штормовой гигант', nameEn: 'Storm Giant', cr: '13' },
    ],
  },
  swamp: {
    '1-4': [
      { nameRu: 'Ядовитая змея', nameEn: 'Poisonous Snake', cr: '1/8' },
      { nameRu: 'Гоблин', nameEn: 'Goblin', cr: '1/4' },
      { nameRu: 'Крокодил', nameEn: 'Crocodile', cr: '1/2' },
    ],
    '5-10': [
      { nameRu: 'Тролль', nameEn: 'Troll', cr: '5' },
      { nameRu: 'Гидра', nameEn: 'Hydra', cr: '8' },
    ],
    '11-16': [
      { nameRu: 'Чёрный дракон (молодой)', nameEn: 'Young Black Dragon', cr: '7' },
      { nameRu: 'Болотный тролль', nameEn: 'Swamp Troll', cr: '5' },
    ],
    '17-20': [
      { nameRu: 'Взрослый чёрный дракон', nameEn: 'Adult Black Dragon', cr: '14' },
      { nameRu: 'Древний чёрный дракон', nameEn: 'Ancient Black Dragon', cr: '21' },
    ],
  },
  desert: {
    '1-4': [
      { nameRu: 'Скорпион', nameEn: 'Scorpion', cr: '0' },
      { nameRu: 'Гоблин', nameEn: 'Goblin', cr: '1/4' },
      { nameRu: 'Гиена', nameEn: 'Hyena', cr: '0' },
    ],
    '5-10': [
      { nameRu: 'Мумия', nameEn: 'Mummy', cr: '3' },
      { nameRu: 'Гигантский скорпион', nameEn: 'Giant Scorpion', cr: '3' },
    ],
    '11-16': [
      { nameRu: 'Синий дракон (молодой)', nameEn: 'Young Blue Dragon', cr: '9' },
      { nameRu: 'Сфинкс', nameEn: 'Sphinx', cr: '11' },
    ],
    '17-20': [
      { nameRu: 'Древний синий дракон', nameEn: 'Ancient Blue Dragon', cr: '23' },
      { nameRu: 'Сфинкс (андросфинкс)', nameEn: 'Androsphinx', cr: '17' },
    ],
  },
  dungeon: {
    '1-4': [
      { nameRu: 'Крыса', nameEn: 'Rat', cr: '0' },
      { nameRu: 'Гоблин', nameEn: 'Goblin', cr: '1/4' },
      { nameRu: 'Кобольд', nameEn: 'Kobold', cr: '1/8' },
      { nameRu: 'Скелет', nameEn: 'Skeleton', cr: '1/4' },
    ],
    '5-10': [
      { nameRu: 'Мимик', nameEn: 'Mimic', cr: '2' },
      { nameRu: 'Огр', nameEn: 'Ogre', cr: '2' },
      { nameRu: 'Тролль', nameEn: 'Troll', cr: '5' },
      { nameRu: 'Мумия', nameEn: 'Mummy', cr: '3' },
    ],
    '11-16': [
      { nameRu: 'Бихолдер', nameEn: 'Beholder', cr: '13' },
      { nameRu: 'Тролль (полый)', nameEn: 'Hollow Troll', cr: '5' },
      { nameRu: 'Вампир', nameEn: 'Vampire', cr: '13' },
    ],
    '17-20': [
      { nameRu: 'Демилич', nameEn: 'Demilich', cr: '18' },
      { nameRu: 'Древний красный дракон', nameEn: 'Ancient Red Dragon', cr: '24' },
    ],
  },
  city: {
    '1-4': [
      { nameRu: 'Бандит', nameEn: 'Bandit', cr: '1/8' },
      { nameRu: 'Гоблин', nameEn: 'Goblin', cr: '1/4' },
      { nameRu: 'Крыса', nameEn: 'Rat', cr: '0' },
    ],
    '5-10': [
      { nameRu: 'Бандит-капитан', nameEn: 'Bandit Captain', cr: '2' },
      { nameRu: 'Огр', nameEn: 'Ogre', cr: '2' },
      { nameRu: 'Доппельгангер', nameEn: 'Doppelganger', cr: '3' },
    ],
    '11-16': [
      { nameRu: 'Ассасин', nameEn: 'Assassin', cr: '8' },
      { nameRu: 'Маг', nameEn: 'Mage', cr: '6' },
    ],
    '17-20': [
      { nameRu: 'Архимаг', nameEn: 'Archmage', cr: '12' },
      { nameRu: 'Вампир', nameEn: 'Vampire', cr: '13' },
    ],
  },
  sea: {
    '1-4': [
      { nameRu: 'Краб', nameEn: 'Crab', cr: '0' },
      { nameRu: 'Морская змея', nameEn: 'Sea Snake', cr: '1/8' },
      { nameRu: 'Пират', nameEn: 'Pirate', cr: '1/8' },
    ],
    '5-10': [
      { nameRu: 'Сахуагин', nameEn: 'Sahuagin', cr: '1/2' },
      { nameRu: 'Гигантский краб', nameEn: 'Giant Crab', cr: '1/2' },
      { nameRu: 'Морской тролль', nameEn: 'Sea Troll', cr: '5' },
    ],
    '11-16': [
      { nameRu: 'Аболет', nameEn: 'Aboleth', cr: '10' },
      { nameRu: 'Морской змей', nameEn: 'Sea Serpent', cr: '5' },
    ],
    '17-20': [
      { nameRu: 'Кракен', nameEn: 'Kraken', cr: '23' },
      { nameRu: 'Древний бронзовый дракон', nameEn: 'Ancient Bronze Dragon', cr: '22' },
    ],
  },
  plains: {
    '1-4': [
      { nameRu: 'Гоблин', nameEn: 'Goblin', cr: '1/4' },
      { nameRu: 'Волк', nameEn: 'Wolf', cr: '1/4' },
      { nameRu: 'Лошадь', nameEn: 'Horse', cr: '1/8' },
    ],
    '5-10': [
      { nameRu: 'Бурый медведь', nameEn: 'Brown Bear', cr: '1' },
      { nameRu: 'Лев', nameEn: 'Lion', cr: '1' },
      { nameRu: 'Огр', nameEn: 'Ogre', cr: '2' },
    ],
    '11-16': [
      { nameRu: 'Мамонт', nameEn: 'Mammoth', cr: '6' },
      { nameRu: 'Великан', nameEn: 'Giant', cr: '6' },
    ],
    '17-20': [
      { nameRu: 'Древний медный дракон', nameEn: 'Ancient Copper Dragon', cr: '21' },
      { nameRu: 'Титан', nameEn: 'Titan', cr: '23' },
    ],
  },
}

// ─── Scene descriptions ───
const SCENE_DESCRIPTIONS: Record<EncounterBiome, { ru: string[]; en: string[] }> = {
  forest: {
    ru: [
      'Тенистые деревья смыкаются над головой, слышен хруст веток.',
      'Лесная поляна, залитая лунным светом, но что-то шевелится в кустах.',
      'Густой подлесок, где каждый шаг отдаётся эхом.',
    ],
    en: [
      'Shady trees close overhead, the crack of branches echoes.',
      'A moonlit forest clearing — but something stirs in the bushes.',
      'Dense undergrowth, where every step echoes.',
    ],
  },
  mountains: {
    ru: [
      'Узкая тропа над пропастью, ветер сбивает с ног.',
      'Камнепад только что прошёл — пыль ещё висит в воздухе.',
      'Снежный перевал, где видимость почти нулевая.',
    ],
    en: [
      'A narrow path above a chasm, the wind knocks you off your feet.',
      'A rockslide just passed — dust still hangs in the air.',
      'A snowy pass where visibility is nearly zero.',
    ],
  },
  swamp: {
    ru: [
      'Мутная вода по колено, пузыри поднимаются на поверхность.',
      'Кривые деревья, увитые лианами, и запах гнили.',
      'Туман над болотом, и странные огни вдалеке.',
    ],
    en: [
      'Murky knee-deep water, bubbles rise to the surface.',
      'Crooked trees wrapped in vines and the smell of rot.',
      'Fog over the swamp and strange lights in the distance.',
    ],
  },
  desert: {
    ru: [
      'Палящее солнце, песок скрипит на зубах.',
      'Барханы, и вдруг — тень на горизонте.',
      'Оазис впереди, но что-то не так с водой.',
    ],
    en: [
      'Blazing sun, sand grits on your teeth.',
      'Dunes — and suddenly a shadow on the horizon.',
      'An oasis ahead, but something is wrong with the water.',
    ],
  },
  dungeon: {
    ru: [
      'Сырые каменные стены, факелы почти догорели.',
      'Коридор разветвляется, и из темноты слышно дыхание.',
      'Заброшенный зал, где эхо шагов звучит слишком громко.',
    ],
    en: [
      'Damp stone walls, the torches have almost burned out.',
      'The corridor forks, and you hear breathing from the dark.',
      'An abandoned hall where your echoing footsteps are too loud.',
    ],
  },
  city: {
    ru: [
      'Тёмный переулок, где фонари не достают до земли.',
      'Шумный рынок, но кто-то следит из толпы.',
      'Крыши, по которым можно уйти от погони.',
    ],
    en: [
      'A dark alley where streetlights do not reach the ground.',
      'A noisy market — but someone is watching from the crowd.',
      'Rooftops you can use to escape pursuit.',
    ],
  },
  sea: {
    ru: [
      'Шторм набирает силу, палуба уходит из-под ног.',
      'Туман над водой, и силуэты в нём.',
      'Остров впереди — но он не на карте.',
    ],
    en: [
      'The storm grows stronger, the deck drops from under your feet.',
      'Fog over the water, and silhouettes within it.',
      'An island ahead — but it is not on the map.',
    ],
  },
  plains: {
    ru: [
      'Бескрайняя степь, и только ветер в траве.',
      'Заброшенная ферма, где давно не ступала нога человека.',
      'Стадо вдалеке, но оно движется слишком быстро.',
    ],
    en: [
      'Endless steppe, only the wind in the grass.',
      'An abandoned farm where no human foot has trod for years.',
      'A herd in the distance, but it moves too fast.',
    ],
  },
}

// ─── Difficulty ───
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

// ─── Public API ───
export function generateEncounter(
  biome: EncounterBiome,
  tier: EncounterTier,
  lang: Lang = 'ru'
): EncounterResult {
  const pool = MONSTERS_BY_BIOME[biome][tier]
  const count = roll(1, 3)
  const selected = pickMany(pool, Math.min(count, pool.length))

  const monsters: EncounterMonster[] = selected.map((m) => ({
    name: L(lang, m.nameRu, m.nameEn),
    cr: m.cr,
    count: roll(1, 4),
  }))

  const totalCount = monsters.reduce((sum, m) => sum + m.count, 0)
  const difficulty = calculateDifficulty(tier, totalCount)
  const description = pick(SCENE_DESCRIPTIONS[biome][lang])

  return { biome, tier, difficulty, monsters, description }
}
