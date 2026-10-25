export type Lang = 'ru' | 'en'

export const LANGS: readonly Lang[] = ['ru', 'en'] as const
export const DEFAULT_LANG: Lang = 'ru'
export const LANG_COOKIE = 'dm-lang'

/** Плоский словарь: ключ → строка. Вложенность через точку. */
export type Dictionary = Record<string, string>

export function isLang(v: unknown): v is Lang {
  return v === 'ru' || v === 'en'
}
