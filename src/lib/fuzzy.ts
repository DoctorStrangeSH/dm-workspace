/**
 * Простой fuzzy-поиск: проверяет, содержит ли `text` символы `query` по порядку.
 * Возвращает score (чем выше — тем лучше) или null, если не совпадает.
 */
export function fuzzyScore(text: string, query: string): number | null {
  if (!query) return 0
  if (!text) return null

  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase()

  // Точное вхождение — максимальный score
  const exactIndex = lowerText.indexOf(lowerQuery)
  if (exactIndex !== -1) {
    // Штраф за позицию (ближе к началу — лучше)
    return 1000 - exactIndex
  }

  // Fuzzy: все символы query должны идти по порядку
  let queryIndex = 0
  let firstMatchIndex = -1
  let lastMatchIndex = -1

  for (let i = 0; i < lowerText.length && queryIndex < lowerQuery.length; i++) {
    if (lowerText[i] === lowerQuery[queryIndex]) {
      if (firstMatchIndex === -1) firstMatchIndex = i
      lastMatchIndex = i
      queryIndex++
    }
  }

  if (queryIndex !== lowerQuery.length) return null

  // Score: чем плотнее совпадение, тем выше
  const spread = lastMatchIndex - firstMatchIndex + 1
  const density = lowerQuery.length / spread

  return Math.round(density * 100) - firstMatchIndex
}

/**
 * Фильтрует и сортирует массив по fuzzy-совпадению.
 */
export function fuzzyFilter<T>(
  items: T[],
  query: string,
  getText: (item: T) => string
): Array<{ item: T; score: number }> {
  if (!query.trim()) {
    return items.map((item) => ({ item, score: 0 }))
  }

  const results: Array<{ item: T; score: number }> = []

  for (const item of items) {
    const score = fuzzyScore(getText(item), query)
    if (score !== null) {
      results.push({ item, score })
    }
  }

  return results.sort((a, b) => b.score - a.score)
}
