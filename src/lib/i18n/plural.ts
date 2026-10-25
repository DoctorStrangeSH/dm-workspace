import type { Lang } from './types'

export function pluralRu(n: number, forms: { one: string; few: string; many: string }): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return forms.one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms.few
  return forms.many
}

/** RU: 3 формы. EN: 2 формы (few = many). */
export function pluralize(
  lang: Lang,
  n: number,
  forms: { one: string; few: string; many: string }
): string {
  if (lang === 'en') return n === 1 ? forms.one : forms.many
  return pluralRu(n, forms)
}
