interface ChapterExportInput {
  chapterTitle: string
  campaignName: string
  chapterContent: string
  createdAt: string
  updatedAt: string
}

/**
 * Формирует Markdown-файл с YAML frontmatter.
 */
export function formatChapterAsMarkdown(data: ChapterExportInput): string {
  const frontmatter = [
    '---',
    `title: ${escapeYaml(data.chapterTitle)}`,
    `campaign: ${escapeYaml(data.campaignName)}`,
    `created: ${data.createdAt}`,
    `updated: ${data.updatedAt}`,
    '---',
    '',
  ].join('\n')

  const header = `# ${data.chapterTitle}\n\n`

  // Если контент уже начинается с # (заголовок), не дублируем
  const content = data.chapterContent.trim().startsWith('#')
    ? data.chapterContent
    : header + data.chapterContent

  return frontmatter + content
}

interface CampaignExportInput {
  campaignName: string
  genre: string | null
  description: string | null
  chapters: Array<{
    title: string
    content_md: string
    order_index: number
    is_visible_to_players: boolean
  }>
}

/**
 * Формирует Markdown-файл всей кампании.
 */
export function formatCampaignAsMarkdown(data: CampaignExportInput): string {
  const parts: string[] = []

  // Заголовок кампании
  parts.push(`# ${data.campaignName}`)
  parts.push('')

  if (data.genre) {
    parts.push(`**Жанр:** ${data.genre}`)
    parts.push('')
  }

  if (data.description) {
    parts.push(`> ${data.description}`)
    parts.push('')
  }

  parts.push('---')
  parts.push('')

  // Содержание
  parts.push('## Содержание')
  parts.push('')
  data.chapters.forEach((ch, i) => {
    parts.push(`${i + 1}. ${ch.title}`)
  })
  parts.push('')
  parts.push('---')
  parts.push('')

  // Главы
  data.chapters.forEach((ch, i) => {
    parts.push(`## Глава ${i + 1}: ${ch.title}`)
    parts.push('')
    if (!ch.is_visible_to_players) {
      parts.push('> ⚠️ **Скрыто от игроков**')
      parts.push('')
    }
    parts.push(ch.content_md)
    parts.push('')
    parts.push('---')
    parts.push('')
  })

  return parts.join('\n')
}

/**
 * Экранирует YAML-значения (если есть `:`, `#`, кавычки).
 */
function escapeYaml(value: string): string {
  if (/[:#"'\n]/.test(value)) {
    return `"${value.replace(/"/g, '\\"')}"`
  }
  return value
}
