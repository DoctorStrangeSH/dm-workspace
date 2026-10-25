import type { Dictionary, Lang } from './types'
import { ru } from './ru'
import { en } from './en'

export const dictionaries: Record<Lang, Dictionary> = { ru, en }

export function getDictionary(lang: Lang): Dictionary {
  return dictionaries[lang] ?? dictionaries.ru
}

/** Возвращает функцию перевода с подстановкой {var}. */
export function createT(dict: Dictionary) {
  return function t(key: string, vars?: Record<string, string | number>): string {
    const template = dict[key] ?? key
    if (!vars) return template
    return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`))
  }
}

export type TFunction = ReturnType<typeof createT>
