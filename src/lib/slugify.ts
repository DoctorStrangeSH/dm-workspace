/**
 * Транслитерация кириллицы в латиницу + очистка для имени файла.
 * "Смерть на Ниле" → "smert-na-nile"
 */
const TRANSLIT_MAP: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'sch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
}

export function slugify(text: string, maxLength = 60): string {
  if (!text) return 'untitled'

  let result = text
    .toLowerCase()
    .trim()
    .split('')
    .map((char) => TRANSLIT_MAP[char] ?? char)
    .join('')

  result = result
    // Заменяем всё, что не буква/цифра/дефис/пробел — на дефис
    .replace(/[^a-z0-9\s-]/g, '')
    // Пробелы и подряд идущие дефисы — в один дефис
    .replace(/[\s-]+/g, '-')
    // Убираем дефисы в начале/конце
    .replace(/^-+|-+$/g, '')

  if (result.length > maxLength) {
    result = result.slice(0, maxLength).replace(/-+$/, '')
  }

  return result || 'untitled'
}

/**
 * Формирует имя файла с расширением.
 */
export function toFilename(title: string, extension: string): string {
  const date = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  return `${slugify(title)}-${date}.${extension}`
}
