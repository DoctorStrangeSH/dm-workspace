import type { AbilityKey, SkillKey } from '@/lib/types'

// ============================================================
// Расы
// ============================================================

export interface RaceInfo {
  slug: string
  name: string
  abilityBonuses: Partial<Record<AbilityKey, number>>
  speed: number
  size: 'small' | 'medium'
}

export const RACES: RaceInfo[] = [
  {
    slug: 'human',
    name: 'Человек',
    abilityBonuses: { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 },
    speed: 30,
    size: 'medium',
  },
  {
    slug: 'elf',
    name: 'Эльф',
    abilityBonuses: { dex: 2 },
    speed: 30,
    size: 'medium',
  },
  {
    slug: 'dwarf',
    name: 'Дворф',
    abilityBonuses: { con: 2 },
    speed: 25,
    size: 'medium',
  },
  {
    slug: 'halfling',
    name: 'Полурослик',
    abilityBonuses: { dex: 2 },
    speed: 25,
    size: 'small',
  },
  {
    slug: 'dragonborn',
    name: 'Драконорождённый',
    abilityBonuses: { str: 2, cha: 1 },
    speed: 30,
    size: 'medium',
  },
  {
    slug: 'gnome',
    name: 'Гном',
    abilityBonuses: { int: 2 },
    speed: 25,
    size: 'small',
  },
  {
    slug: 'half-elf',
    name: 'Полуэльф',
    abilityBonuses: { cha: 2 },
    speed: 30,
    size: 'medium',
  },
  {
    slug: 'half-orc',
    name: 'Полуорк',
    abilityBonuses: { str: 2, con: 1 },
    speed: 30,
    size: 'medium',
  },
  {
    slug: 'tiefling',
    name: 'Тифлинг',
    abilityBonuses: { int: 1, cha: 2 },
    speed: 30,
    size: 'medium',
  },
]

// ============================================================
// Классы
// ============================================================

export interface ClassInfo {
  slug: string
  name: string
  hitDie: 6 | 8 | 10 | 12
  primaryAbility: AbilityKey | AbilityKey[]
  savingThrows: AbilityKey[]
  skillChoices: { count: number; from: SkillKey[] }
}

export const CLASSES: ClassInfo[] = [
  {
    slug: 'barbarian',
    name: 'Варвар',
    hitDie: 12,
    primaryAbility: 'str',
    savingThrows: ['str', 'con'],
    skillChoices: {
      count: 2,
      from: ['animal-handling', 'athletics', 'intimidation', 'nature', 'perception', 'survival'],
    },
  },
  {
    slug: 'bard',
    name: 'Бард',
    hitDie: 8,
    primaryAbility: 'cha',
    savingThrows: ['dex', 'cha'],
    skillChoices: {
      count: 3,
      from: ['acrobatics', 'animal-handling', 'arcana', 'athletics', 'deception', 'history', 'insight', 'intimidation', 'investigation', 'medicine', 'nature', 'perception', 'performance', 'persuasion', 'religion', 'sleight-of-hand', 'stealth', 'survival'],
    },
  },
  {
    slug: 'cleric',
    name: 'Жрец',
    hitDie: 8,
    primaryAbility: 'wis',
    savingThrows: ['wis', 'cha'],
    skillChoices: {
      count: 2,
      from: ['history', 'insight', 'medicine', 'persuasion', 'religion'],
    },
  },
  {
    slug: 'druid',
    name: 'Друид',
    hitDie: 8,
    primaryAbility: 'wis',
    savingThrows: ['int', 'wis'],
    skillChoices: {
      count: 2,
      from: ['arcana', 'animal-handling', 'insight', 'medicine', 'nature', 'perception', 'religion', 'survival'],
    },
  },
  {
    slug: 'fighter',
    name: 'Воин',
    hitDie: 10,
    primaryAbility: 'str',
    savingThrows: ['str', 'con'],
    skillChoices: {
      count: 2,
      from: ['acrobatics', 'animal-handling', 'athletics', 'history', 'insight', 'intimidation', 'perception', 'survival'],
    },
  },
  {
    slug: 'monk',
    name: 'Монах',
    hitDie: 8,
    primaryAbility: ['dex', 'wis'],
    savingThrows: ['str', 'dex'],
    skillChoices: {
      count: 2,
      from: ['acrobatics', 'athletics', 'history', 'insight', 'religion', 'stealth'],
    },
  },
  {
    slug: 'paladin',
    name: 'Паладин',
    hitDie: 10,
    primaryAbility: ['str', 'cha'],
    savingThrows: ['wis', 'cha'],
    skillChoices: {
      count: 2,
      from: ['athletics', 'insight', 'intimidation', 'medicine', 'persuasion', 'religion'],
    },
  },
  {
    slug: 'ranger',
    name: 'Следопыт',
    hitDie: 10,
    primaryAbility: ['dex', 'wis'],
    savingThrows: ['str', 'dex'],
    skillChoices: {
      count: 3,
      from: ['animal-handling', 'athletics', 'insight', 'investigation', 'nature', 'perception', 'stealth', 'survival'],
    },
  },
  {
    slug: 'rogue',
    name: 'Плут',
    hitDie: 8,
    primaryAbility: 'dex',
    savingThrows: ['dex', 'int'],
    skillChoices: {
      count: 4,
      from: ['acrobatics', 'athletics', 'deception', 'insight', 'intimidation', 'investigation', 'perception', 'performance', 'persuasion', 'sleight-of-hand', 'stealth'],
    },
  },
  {
    slug: 'sorcerer',
    name: 'Чародей',
    hitDie: 6,
    primaryAbility: 'cha',
    savingThrows: ['con', 'cha'],
    skillChoices: {
      count: 2,
      from: ['arcana', 'deception', 'insight', 'intimidation', 'persuasion', 'religion'],
    },
  },
  {
    slug: 'warlock',
    name: 'Колдун',
    hitDie: 8,
    primaryAbility: 'cha',
    savingThrows: ['wis', 'cha'],
    skillChoices: {
      count: 2,
      from: ['arcana', 'deception', 'history', 'intimidation', 'investigation', 'nature', 'religion'],
    },
  },
  {
    slug: 'wizard',
    name: 'Волшебник',
    hitDie: 6,
    primaryAbility: 'int',
    savingThrows: ['int', 'wis'],
    skillChoices: {
      count: 2,
      from: ['arcana', 'history', 'insight', 'investigation', 'medicine', 'religion'],
    },
  },
]

// ============================================================
// Предыстории
// ============================================================

export interface BackgroundInfo {
  slug: string
  name: string
  skills: SkillKey[]
}

export const BACKGROUNDS: BackgroundInfo[] = [
  {
    slug: 'acolyte',
    name: 'Послушник',
    skills: ['insight', 'religion'],
  },
  {
    slug: 'criminal',
    name: 'Преступник',
    skills: ['deception', 'stealth'],
  },
  {
    slug: 'folk-hero',
    name: 'Народный герой',
    skills: ['animal-handling', 'survival'],
  },
  {
    slug: 'noble',
    name: 'Дворянин',
    skills: ['history', 'persuasion'],
  },
  {
    slug: 'sage',
    name: 'Мудрец',
    skills: ['arcana', 'history'],
  },
  {
    slug: 'soldier',
    name: 'Солдат',
    skills: ['athletics', 'intimidation'],
  },
  {
    slug: 'charlatan',
    name: 'Шарлатан',
    skills: ['deception', 'sleight-of-hand'],
  },
  {
    slug: 'entertainer',
    name: 'Артист',
    skills: ['acrobatics', 'performance'],
  },
  {
    slug: 'guild-artisan',
    name: 'Ремесленник',
    skills: ['insight', 'persuasion'],
  },
  {
    slug: 'hermit',
    name: 'Отшельник',
    skills: ['medicine', 'religion'],
  },
  {
    slug: 'outlander',
    name: 'Чужеземец',
    skills: ['athletics', 'survival'],
  },
  {
    slug: 'sailor',
    name: 'Моряк',
    skills: ['athletics', 'perception'],
  },
  {
    slug: 'urchin',
    name: 'Беспризорник',
    skills: ['sleight-of-hand', 'stealth'],
  },
]

// ============================================================
// Point Buy
// ============================================================

export const POINT_BUY_COSTS: Record<number, number> = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
}

export const POINT_BUY_TOTAL = 27

export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8] as const

// ============================================================
// Заклинательная характеристика
// ============================================================

export const SPELLCASTING_ABILITY: Record<string, AbilityKey> = {
  bard: 'cha',
  cleric: 'wis',
  druid: 'wis',
  paladin: 'cha',
  ranger: 'wis',
  sorcerer: 'cha',
  warlock: 'cha',
  wizard: 'int',
}

export function getSpellcastingAbility(
  classSlug: string
): AbilityKey | undefined {
  return SPELLCASTING_ABILITY[classSlug]
}

// ============================================================
// ASI
// ============================================================

export const ASI_LEVELS = [4, 8, 12, 16, 19]

export function hasASI(level: number): boolean {
  return ASI_LEVELS.includes(level)
}