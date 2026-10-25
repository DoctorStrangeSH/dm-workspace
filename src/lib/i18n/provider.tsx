'use client'

import { createContext, useContext, useMemo, useSyncExternalStore } from 'react'
import type { Lang } from './types'
import { LANG_COOKIE, DEFAULT_LANG, isLang } from './types'
import { createT, getDictionary, type TFunction } from './dictionaries'

interface I18nContextValue {
  lang: Lang
  t: TFunction
}

const I18nContext = createContext<I18nContextValue | null>(null)

// CHANGES:
// I18nProvider больше не принимает lang пропом (RootLayout статический).
// Язык читается из cookie через useSyncExternalStore:
//  - SSR:      DEFAULT_LANG ('ru') — совпадает с <html lang="ru">
//  - клиент:   синхронно из document.cookie
//  - обновление: после router.refresh() (LangToggle) → ре-рендер провайдера
// Это чинит build-ошибку "cookies() в RootLayout блокирует prerender".

function subscribe(_callback: () => void) {
  // cookie не шлёт событий; подписка нужна только для API useSyncExternalStore.
  return () => {}
}

function getSnapshot(): Lang {
  if (typeof document === 'undefined') return DEFAULT_LANG
  const m = document.cookie.match(new RegExp(`(?:^|;\\s*)${LANG_COOKIE}=([^;]+)`))
  return isLang(m?.[1]) ? (m![1] as Lang) : DEFAULT_LANG
}

function getServerSnapshot(): Lang {
  return DEFAULT_LANG
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const lang = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const value = useMemo<I18nContextValue>(() => {
    const dict = getDictionary(lang)
    return { lang, t: createT(dict) }
  }, [lang])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}

/** Обычно нужен только t. */
export function useT(): TFunction {
  return useI18n().t
}

export function useLang(): Lang {
  return useI18n().lang
}
