import type { TFunction } from '@/lib/i18n/dictionaries'

/** Display only: keep custom source categories when no translation exists. */
export function monsterCategoryLabel(kind: 'type' | 'size', value: string, t: TFunction): string {
  const raw = value.trim()
  if (!raw) return '—'
  const key = (kind === 'type' ? 'monsterType.' : 'monsterSize.') + raw.toLowerCase()
  const translated = t(key)
  return translated === key ? raw : translated
}
