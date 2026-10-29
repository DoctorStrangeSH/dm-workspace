import { CLASSES, RACES } from './constants'
import { baseClassSlug } from './srd-class-utils'
import type { Lang } from '@/lib/i18n/types'

const CLASS_EN: Record<string, string> = {
  barbarian: 'Barbarian',
  bard: 'Bard',
  cleric: 'Cleric',
  druid: 'Druid',
  fighter: 'Fighter',
  monk: 'Monk',
  paladin: 'Paladin',
  ranger: 'Ranger',
  rogue: 'Rogue',
  sorcerer: 'Sorcerer',
  warlock: 'Warlock',
  wizard: 'Wizard',
}
const SPECIES_EN: Record<string, string> = {
  human: 'Human',
  elf: 'Elf',
  dwarf: 'Dwarf',
  halfling: 'Halfling',
  dragonborn: 'Dragonborn',
  gnome: 'Gnome',
  'half-elf': 'Half-Elf',
  'half-orc': 'Half-Orc',
  tiefling: 'Tiefling',
  orc: 'Orc',
  goliath: 'Goliath',
  aasimar: 'Aasimar',
}
const EXTRA_SPECIES_RU: Record<string, string> = {
  orc: 'Орк',
  goliath: 'Голиаф',
  aasimar: 'Аасимар',
}

/** Display only: never rewrite saved SRD IDs or invent rules for an unknown entry. */
export function characterClassName(key: string, lang: Lang = 'ru', fallback?: string): string {
  const slug = baseClassSlug(key)
  return (
    (lang === 'ru' ? CLASSES.find((entry) => entry.slug === slug)?.name : CLASS_EN[slug]) ??
    (fallback?.trim() || key || (lang === 'ru' ? 'Класс не выбран' : 'No class selected'))
  )
}

export function characterSpeciesName(key: string, lang: Lang = 'ru', fallback?: string): string {
  const slug = key.replace(/^srd-2024_/, '')
  return (
    (lang === 'ru'
      ? (RACES.find((entry) => entry.slug === slug)?.name ?? EXTRA_SPECIES_RU[slug])
      : SPECIES_EN[slug]) ??
    (fallback?.trim() || key || (lang === 'ru' ? 'Раса не выбрана' : 'No species selected'))
  )
}
