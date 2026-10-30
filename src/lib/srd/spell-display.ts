import type { TFunction } from '@/lib/i18n/dictionaries'

/** Display only: unknown schools retain source text rather than a missing i18n key. */
export function spellSchoolLabel(school: string, t: TFunction): string {
  const raw = school.trim()
  if (!raw) return '—'
  const key = 'school.' + raw.toLowerCase()
  const translated = t(key)
  return translated === key ? raw : translated
}
