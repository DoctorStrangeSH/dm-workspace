import type { Lang } from './types'
import { getDictionary } from './dictionaries'
import type { AbilityKey, SkillKey, SpellSchool } from '@/lib/types'

/** Хелперы для UI-меток, которые раньше жили в types.ts как константы.
 *  Принимают lang напрямую → работают и на сервере, и на клиенте.
 *  Не ломают types.ts (старые константы остаются для обратной совместимости).
 */

function tr(lang: Lang, key: string): string {
  return getDictionary(lang)[key] ?? key
}

export function abilityLabel(lang: Lang, key: AbilityKey): string {
  return tr(lang, `ability.${key}`)
}

export function abilityShort(lang: Lang, key: AbilityKey): string {
  return tr(lang, `abilityShort.${key}`)
}

export function skillLabel(lang: Lang, key: SkillKey): string {
  // ключи с дефисом → camelCase
  const camel = key.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())
  return tr(lang, `skill.${camel}`)
}

export function spellSchoolLabel(lang: Lang, key: SpellSchool): string {
  return tr(lang, `school.${key}`)
}

export function currencyLabel(lang: Lang, key: 'pp' | 'gp' | 'sp' | 'cp'): string {
  return tr(lang, `currency.${key}`)
}

export function currencyShort(lang: Lang, key: 'pp' | 'gp' | 'sp' | 'cp'): string {
  return tr(lang, `currencyShort.${key}`)
}
