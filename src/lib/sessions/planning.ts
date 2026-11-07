import type { SessionWithRsvp } from '@/lib/types'

export function sessionWindow(session: Pick<SessionWithRsvp, 'starts_at' | 'duration_minutes'>) {
  const start = Date.parse(session.starts_at)
  if (
    !Number.isFinite(start) ||
    !Number.isSafeInteger(session.duration_minutes) ||
    session.duration_minutes <= 0
  )
    return null
  const end = start + session.duration_minutes * 60_000
  return Number.isSafeInteger(end) && Number.isFinite(new Date(end).getTime())
    ? { start, end }
    : null
}

export function planSessions(sessions: SessionWithRsvp[], now: number) {
  const upcoming: SessionWithRsvp[] = [],
    past: SessionWithRsvp[] = [],
    undated: SessionWithRsvp[] = []
  for (const session of sessions) {
    const timing = sessionWindow(session)
    if (!timing || !Number.isFinite(now)) undated.push(session)
    else if (timing.end <= now) past.push(session)
    else upcoming.push(session)
  }
  upcoming.sort(
    (a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at) || a.id.localeCompare(b.id)
  )
  past.sort((a, b) => Date.parse(b.starts_at) - Date.parse(a.starts_at) || a.id.localeCompare(b.id))
  return { upcoming, past, undated }
}

const calendarText = (text: string) =>
  text
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
const utc = (date: number) =>
  new Date(date)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z')
// RFC 5545: content lines fold at 75 UTF-8 octets, never inside a code point.
function fold(line: string) {
  const encoder = new TextEncoder()
  let output = '',
    length = 0
  for (const character of line) {
    const size = encoder.encode(character).length
    if (length + size > 75) {
      output += '\r\n '
      length = 1
    }
    output += character
    length += size
  }
  return output
}

/** Local calendar file only: no attendee list, invitations, tokens or backend writes. */
export function sessionCalendar(session: SessionWithRsvp, now: number): string | null {
  const timing = sessionWindow(session)
  if (!timing || !Number.isFinite(new Date(now).getTime())) return null
  if (![timing.start, timing.end, now].every((value) => /^\d{8}T\d{6}Z$/.test(utc(value))))
    return null
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DM Workspace//Sessions//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    'UID:' + encodeURIComponent(session.id) + '@dm-workspace.vercel.app',
    'DTSTAMP:' + utc(now),
    'DTSTART:' + utc(timing.start),
    'DTEND:' + utc(timing.end),
    'SUMMARY:' + calendarText(session.title),
    ...(session.description ? ['DESCRIPTION:' + calendarText(session.description)] : []),
    'URL:https://dm-workspace.vercel.app/campaign/' +
      encodeURIComponent(session.campaign_id) +
      '/sessions',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return lines.map(fold).join('\r\n') + '\r\n'
}
