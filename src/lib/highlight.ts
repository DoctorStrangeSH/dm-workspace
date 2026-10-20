import { escapeRegExp } from './utils'

/**
 * Разбивает строку на части — совпадающие с query и нет.
 * Возвращает массив: [{ text, matched }]
 */
export function splitByQuery(
  text: string,
  query: string
): Array<{ text: string; matched: boolean }> {
  if (!query.trim()) {
    return [{ text, matched: false }]
  }

  const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi')
  const parts = text.split(regex)

  return parts
    .filter((p) => p.length > 0)
    .map((part) => ({
      text: part,
      matched: regex.test(part),
    }))
}

/**
 * Извлекает сниппет вокруг первого совпадения.
 * Возвращает { before, match, after } — для подсветки контекста.
 */
export function extractSnippet(
  text: string,
  query: string,
  contextChars = 40
): { before: string; match: string; after: string } | null {
  if (!query.trim()) return null

  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const index = lowerText.indexOf(lowerQuery)

  if (index === -1) return null

  const start = Math.max(0, index - contextChars)
  const end = Math.min(text.length, index + query.length + contextChars)

  return {
    before: (start > 0 ? '…' : '') + text.slice(start, index),
    match: text.slice(index, index + query.length),
    after: text.slice(index + query.length, end) + (end < text.length ? '…' : ''),
  }
}
