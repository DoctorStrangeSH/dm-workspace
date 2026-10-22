/**
 * Безумие (Madness) — d100 таблица.
 * По правилам DMG: краткосрочное (1d10 минут), долгосрочное (1d10 × 10 часов), бессрочное.
 */

export type MadnessType = 'short' | 'long' | 'indefinite'

export interface MadnessEffect {
  roll: number
  name: string
  description: string
  icon: string
}

export const SHORT_MADNESS: MadnessEffect[] = [
  { roll: 1, name: 'Оцепенение', description: 'Персонаж парализован на 1 минуту.', icon: '🧊' },
  {
    roll: 2,
    name: 'Паника',
    description: 'Персонаж в панике бежит от всех на 1 минуту.',
    icon: '🏃',
  },
  {
    roll: 3,
    name: 'Бред',
    description: 'Персонаж бредит 1 минуту, не может действовать.',
    icon: '💬',
  },
  { roll: 4, name: 'Смех', description: 'Персонаж смеётся 1 минуту, помеха на всё.', icon: '😂' },
  { roll: 5, name: 'Плач', description: 'Персонаж плачет 1 минуту, помеха на всё.', icon: '😢' },
  {
    roll: 6,
    name: 'Ярость',
    description: 'Персонаж в ярости атакует ближайшее существо.',
    icon: '😡',
  },
  { roll: 7, name: 'Страх', description: 'Персонаж испуган 1 минуту.', icon: '😨' },
  { roll: 8, name: 'Одержимость', description: 'Персонаж одержим идеей 1 минуту.', icon: '🌀' },
  {
    roll: 9,
    name: 'Кататония',
    description: 'Персонаж в кататонии 1 минуту, не двигается.',
    icon: '😶',
  },
  {
    roll: 10,
    name: 'Галлюцинации',
    description: 'Персонаж видит галлюцинации 1 минуту.',
    icon: '👁️',
  },
]

export const LONG_MADNESS: MadnessEffect[] = [
  {
    roll: 1,
    name: 'Амнезия',
    description: 'Персонаж теряет память за последние 1d10 дней.',
    icon: '🧠',
  },
  { roll: 2, name: 'Паранойя', description: 'Персонаж параноидален 1d10 × 10 часов.', icon: '👀' },
  {
    roll: 3,
    name: 'Одержимость',
    description: 'Персонаж одержим идеей 1d10 × 10 часов.',
    icon: '🌀',
  },
  {
    roll: 4,
    name: 'Фобия',
    description: 'Персонаж получает фобию на 1d10 × 10 часов.',
    icon: '😱',
  },
  {
    roll: 5,
    name: 'Мания',
    description: 'Персонаж получает манию на 1d10 × 10 часов.',
    icon: '🔥',
  },
  { roll: 6, name: 'Апатия', description: 'Персонаж апатичен 1d10 × 10 часов.', icon: '😐' },
  {
    roll: 7,
    name: 'Бессонница',
    description: 'Персонаж не может спать 1d10 × 10 часов.',
    icon: '🌙',
  },
  {
    roll: 8,
    name: 'Кошмары',
    description: 'Персонаж страдает от кошмаров 1d10 × 10 часов.',
    icon: '💭',
  },
  {
    roll: 9,
    name: 'Тремор',
    description: 'Персонаж дрожит 1d10 × 10 часов, помеха на DEX.',
    icon: '🫨',
  },
  { roll: 10, name: 'Агрессия', description: 'Персонаж агрессивен 1d10 × 10 часов.', icon: '😡' },
]

export const INDEFINITE_MADNESS: MadnessEffect[] = [
  { roll: 1, name: 'Шизофрения', description: 'Персонаж теряет связь с реальностью.', icon: '🌀' },
  {
    roll: 2,
    name: 'Раздвоение',
    description: 'У персонажа появляется вторая личность.',
    icon: '👥',
  },
  { roll: 3, name: 'Паранойя', description: 'Персонаж постоянно параноидален.', icon: '👀' },
  { roll: 4, name: 'Одержимость', description: 'Персонаж одержим идеей навсегда.', icon: '🌀' },
  { roll: 5, name: 'Фобия', description: 'Персонаж получает постоянную фобию.', icon: '😱' },
  { roll: 6, name: 'Мания', description: 'Персонаж получает постоянную манию.', icon: '🔥' },
  { roll: 7, name: 'Апатия', description: 'Персонаж апатичен навсегда.', icon: '😐' },
  { roll: 8, name: 'Бессонница', description: 'Персонаж не может спать.', icon: '🌙' },
  { roll: 9, name: 'Кошмары', description: 'Персонаж страдает от кошмаров навсегда.', icon: '💭' },
  { roll: 10, name: 'Агрессия', description: 'Персонаж агрессивен навсегда.', icon: '😡' },
]

export interface MadnessResult {
  type: MadnessType
  roll: number
  effect: MadnessEffect
  duration: string
}

export function generateMadness(type: MadnessType): MadnessResult {
  const table =
    type === 'short' ? SHORT_MADNESS : type === 'long' ? LONG_MADNESS : INDEFINITE_MADNESS

  const roll = Math.floor(Math.random() * table.length) + 1
  const effect = table.find((e) => e.roll === roll) ?? table[0]

  const duration =
    type === 'short' ? '1d10 минут' : type === 'long' ? '1d10 × 10 часов' : 'навсегда'

  return { type, roll, effect, duration }
}
