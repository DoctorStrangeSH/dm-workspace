import 'server-only'
import { cookies } from 'next/headers'
import { LANG_COOKIE, DEFAULT_LANG, isLang, type Lang } from './types'

/**
 * Читает язык из cookie. Только для Server Components / layouts / route handlers.
 * В client — useLang() из provider.
 */
export async function getLang(): Promise<Lang> {
  const store = await cookies()
  const v = store.get(LANG_COOKIE)?.value
  return isLang(v) ? v : DEFAULT_LANG
}
