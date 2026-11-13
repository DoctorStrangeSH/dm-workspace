import type { CharacterData, CharacterAttack } from '@/lib/types'
import { rollChatDice } from './chat-dice'

export function rollCharacterDamage(formula: string, random = Math.random) {
  const match = formula
    .trim()
    .toLowerCase()
    .match(/^(\d{1,2})d(4|6|8|10|12|20|100)([+-]\d{1,3})?$/)
  if (match) {
    const result = rollChatDice(
      Number(match[2]),
      Number(match[1]),
      Number(match[3] ?? 0),
      'normal',
      random
    )
    return result ? { ...result, total: Math.max(0, result.total) } : null
  }
  if (/^\d{1,3}$/.test(formula.trim())) {
    const value = Number(formula.trim())
    if (value <= 100) return { total: value, expression: formula.trim(), rolls: [] }
  }
  return null
}

export interface FeatureDraft {
  features: string[]
  traits: string[]
  notes: string
  attacks?: CharacterAttack[]
}

/** Preserve the complete version the editor actually opened; the existing action performs CAS. */
export function characterFeaturePatch(original: CharacterData, draft: FeatureDraft) {
  if (!draft || typeof draft.notes !== 'string' || draft.notes.length > 12000) return null
  for (const list of [draft.features, draft.traits]) {
    if (
      !Array.isArray(list) ||
      list.length > 50 ||
      list.some((value) => typeof value !== 'string' || !value.trim() || value.length > 2000)
    )
      return null
  }
  if (
    draft.attacks !== undefined &&
    (!Array.isArray(draft.attacks) ||
      draft.attacks.length > 30 ||
      draft.attacks.some(
        (attack) =>
          !attack ||
          typeof attack.name !== 'string' ||
          !attack.name.trim() ||
          attack.name.length > 150 ||
          !Number.isSafeInteger(attack.bonus) ||
          Math.abs(attack.bonus) > 100 ||
          typeof attack.damage !== 'string' ||
          !attack.damage.trim() ||
          attack.damage.length > 100 ||
          (attack.notes !== undefined &&
            (typeof attack.notes !== 'string' || attack.notes.length > 2000))
      ))
  )
    return null
  return {
    expected_data_json: original,
    data_json: {
      ...original,
      features: [...draft.features],
      traits: [...draft.traits],
      notes: draft.notes,
      ...(draft.attacks ? { attacks: draft.attacks.map((attack) => ({ ...attack })) } : {}),
    },
  }
}

export function isConcentration(duration: string | undefined) {
  return /\bconcentration\b|концентраци/i.test(duration ?? '')
}

/** Translate known rule labels only. Unknown/custom text is preserved verbatim. */
export function spellRuleText(value: string | undefined, lang: 'ru' | 'en'): string {
  if (!value) return ''
  if (lang === 'en') return value
  const exact: Record<string, string> = {
    instantaneous: 'Мгновенно',
    instant: 'Мгновенно',
    self: 'На себя',
    touch: 'Касание',
    special: 'Особая',
    unlimited: 'Неограниченная',
    'until dispelled': 'Пока не рассеяно',
    '1 action': '1 действие',
    '1 bonus action': '1 бонусное действие',
    '1 reaction': '1 реакция',
  }
  const raw = value.trim()
  if (exact[raw.toLowerCase()]) return exact[raw.toLowerCase()]
  return raw
    .replace(/\bconcentration,?\s*/gi, 'Концентрация, ')
    .replace(/\bup to\b/gi, 'до')
    .replace(/\b(\d+)\s*feet\b/gi, '$1 фт')
    .replace(/\b(\d+)\s*foot\b/gi, '$1 фт')
    .replace(/\b(\d+)\s*minutes?\b/gi, '$1 мин')
    .replace(/\b(\d+)\s*hours?\b/gi, '$1 ч')
    .replace(/\b(\d+)\s*rounds?\b/gi, '$1 раунд.')
}
