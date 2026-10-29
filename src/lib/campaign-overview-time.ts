import type { Lang } from './i18n/types'

/** Use one server-supplied instant so relative labels are stable on first render. */
export function campaignRelativeTime(iso: string, lang: Lang, now: number): string | null {
  const timestamp = Date.parse(iso)
  if (!Number.isFinite(timestamp) || !Number.isFinite(now)) return null
  const minutes = Math.floor(Math.max(0, now - timestamp) / 60000)
  const relative = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' })
  if (minutes < 1) return relative.format(0, 'minute')
  if (minutes < 60) return relative.format(-minutes, 'minute')
  if (minutes < 1440) return relative.format(-Math.floor(minutes / 60), 'hour')
  if (minutes < 10080) return relative.format(-Math.floor(minutes / 1440), 'day')
  return new Intl.DateTimeFormat(lang, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(timestamp)
}
