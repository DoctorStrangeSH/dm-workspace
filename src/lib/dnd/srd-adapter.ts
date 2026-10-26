import type { SrdSpecies, SrdClass } from '@/lib/queries/srd'
import type { RaceInfo, ClassInfo } from '@/lib/dnd/constants'
import type { AbilityKey, SkillKey } from '@/lib/types'

const ABILITY_MAP: Record<string, AbilityKey> = {
  strength: 'str',
  dexterity: 'dex',
  constitution: 'con',
  intelligence: 'int',
  wisdom: 'wis',
  charisma: 'cha',
  str: 'str',
  dex: 'dex',
  con: 'con',
  int: 'int',
  wis: 'wis',
  cha: 'cha',
}

export function srdSpeciesToRaceInfo(species: SrdSpecies): RaceInfo {
  const data = species.data ?? {}

  // Скорость
  let speed = 30
  if (typeof data.speed === 'number') speed = data.speed
  else if (typeof data.speed === 'string') {
    const m = data.speed.match(/\d+/)
    if (m) speed = parseInt(m[0], 10)
  } else if (typeof data.speed?.walk === 'number') speed = data.speed.walk

  // Бонусы характеристик (если есть)
  const bonuses: Partial<Record<AbilityKey, number>> = {}
  if (Array.isArray(data.ability_bonuses)) {
    for (const b of data.ability_bonuses) {
      const raw = b.ability_score?.index ?? b.ability_score?.name ?? b.ability_score
      const key = ABILITY_MAP[String(raw).toLowerCase()]
      if (key && typeof b.bonus === 'number') bonuses[key] = b.bonus
    }
  }

  return {
    slug: species.key,
    name: species.name_ru ?? species.name,
    abilityBonuses: bonuses,
    speed,
    size: (data.size?.name ?? data.size ?? 'Medium').toString().toLowerCase().includes('small')
      ? 'small'
      : 'medium',
  }
}

export function srdClassToClassInfo(cls: SrdClass): ClassInfo {
  const data = cls.data ?? {}

  // Спасброски
  let savingThrows: AbilityKey[] = []
  if (Array.isArray(data.saving_throws)) {
    savingThrows = data.saving_throws
      .map((s: any) => {
        const raw = s?.index ?? s?.name ?? s
        return ABILITY_MAP[String(raw).toLowerCase()]
      })
      .filter(Boolean) as AbilityKey[]
  }

  // Навыки — базовые, если нет данных
  const baseSkills: SkillKey[] = [
    'athletics',
    'acrobatics',
    'sleight-of-hand',
    'stealth',
    'arcana',
    'history',
    'investigation',
    'nature',
    'religion',
    'animal-handling',
    'insight',
    'medicine',
    'perception',
    'survival',
    'deception',
    'intimidation',
    'performance',
    'persuasion',
  ]

  const slug = cls.key.replace(/^srd-2024_/, '')
  const rawHitDie = data.hit_die
  const parsedHitDie = typeof rawHitDie === 'number' ? rawHitDie : Number(String(rawHitDie ?? '').replace(/^d/i, ''))
  const hitDie: 6 | 8 | 10 | 12 =
    parsedHitDie === 6 || parsedHitDie === 8 || parsedHitDie === 10 || parsedHitDie === 12
      ? parsedHitDie
      : 8

  return {
    slug,
    name: cls.name_ru ?? cls.name,
    hitDie,
    primaryAbility: 'str',
    savingThrows,
    skillChoices: {
      count: 2,
      from: baseSkills,
    },
  }
}
