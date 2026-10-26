import { CLASSES, RACES } from './constants'
import { baseClassSlug } from './srd-class-utils'

export function characterClassName(key: string): string {
  const slug = baseClassSlug(key)
  return CLASSES.find((entry) => entry.slug === slug)?.name ??
    (key || 'Класс не выбран')
}

export function characterSpeciesName(key: string): string {
  const slug = key.replace(/^srd-2024_/, '')
  return RACES.find((entry) => entry.slug === slug)?.name ??
    (key || 'Раса не выбрана')
}
