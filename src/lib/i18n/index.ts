// Types
export type { Lang, Dictionary } from './types'
export { LANG_COOKIE, DEFAULT_LANG, LANGS, isLang } from './types'

// Dictionaries
export { dictionaries, getDictionary, createT } from './dictionaries'
export type { TFunction } from './dictionaries'

// Pluralization
export { pluralize, pluralRu } from './plural'

// Client provider
export { I18nProvider, useI18n, useT, useLang } from './provider'

// ⚠️ get-lang.ts НЕ реэкспортируем — он server-only.
// Импортировать напрямую: import { getLang } from '@/lib/i18n/get-lang'
