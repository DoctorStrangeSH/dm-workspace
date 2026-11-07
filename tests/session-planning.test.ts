import assert from 'node:assert/strict'
import { test } from 'node:test'
import { planSessions, sessionWindow, sessionCalendar } from '../src/lib/sessions/planning'
import type { SessionWithRsvp } from '../src/lib/types'
const session = (id: string, starts_at: string, duration_minutes = 180): SessionWithRsvp => ({
  id,
  starts_at,
  duration_minutes,
  campaign_id: 'campaign',
  title: 'Adventure',
  description: null,
  created_by: 'owner',
  created_at: '2026-11-07T12:00:00Z',
  creator: { id: 'owner', username: 'owner', display_name: null },
  rsvps: [],
})
const now = Date.parse('2026-11-07T12:00:00Z')
test('planning keeps ongoing games until end, sorts future/archive and preserves original data', () => {
  const input = [
    session('later', '2026-11-08T12:00:00Z'),
    session('oldest', '2020-01-01T12:00:00Z'),
    session('invalid', 'broken'),
    session('ended', '2026-11-07T09:00:00Z'),
    session('ongoing', '2026-11-07T11:00:00Z'),
    session('next', '2026-11-07T15:00:00Z'),
  ]
  const snapshot = structuredClone(input)
  const groups = planSessions(input, now)
  assert.deepEqual(
    groups.upcoming.map((s) => s.id),
    ['ongoing', 'next', 'later']
  )
  assert.deepEqual(
    groups.past.map((s) => s.id),
    ['ended', 'oldest']
  )
  assert.deepEqual(
    groups.undated.map((s) => s.id),
    ['invalid']
  )
  assert.deepEqual(input, snapshot)
  assert.equal(planSessions([input[4]], Date.parse('2026-11-07T14:00:00Z')).past.length, 1)
})
test('malformed duration and invalid dates are never treated as upcoming or exported', () => {
  for (const duration of [0, -1, NaN, Infinity, 1.5, Number.MAX_SAFE_INTEGER]) {
    const item = session('bad', '2026-11-07T12:00:00Z', duration)
    assert.equal(sessionWindow(item), null)
    assert.equal(planSessions([item], now).undated.length, 1)
    assert.equal(sessionCalendar(item, now), null)
  }
  assert.equal(sessionCalendar(session('bad', 'invalid'), now), null)
  assert.equal(sessionCalendar(session('ok', '2026-11-07T12:00:00Z'), NaN), null)
  assert.equal(planSessions([session('ok', '2026-11-07T12:00:00Z')], NaN).undated.length, 1)
})
test('calendar exports a single UTC event with duration, stable identity and a campaign link', () => {
  const item = session('event', '2026-11-07T15:00:00+03:00', 90)
  const file = sessionCalendar(item, now)!
  assert.ok(file.endsWith('END:VCALENDAR\r\n'))
  for (const line of [
    'UID:event@dm-workspace.vercel.app',
    'DTSTAMP:20261107T120000Z',
    'DTSTART:20261107T120000Z',
    'DTEND:20261107T133000Z',
    'URL:https://dm-workspace.vercel.app/campaign/campaign/sessions',
  ])
    assert.ok(file.includes(line + '\r\n'), line)
  assert.equal(file.split('BEGIN:VEVENT').length, 2)
  assert.doesNotMatch(file, /ATTENDEE|ORGANIZER|METHOD:REQUEST|TRIGGER/)
  assert.equal(sessionCalendar(item, now + 1000)!.match(/UID:.+/)![0], file.match(/UID:.+/)![0])
})
test('calendar escapes property injection and folds Unicode at 75 UTF-8 octets', () => {
  const item = {
    ...session('event\r\nATTENDEE:bad', '2026-11-07T12:00:00Z'),
    title: 'Приключение 🐉'.repeat(25) + ';comma,slash\\end',
    description: 'First\r\nATTENDEE:evil\rEND:VEVENT\nLast\u0000',
  }
  const file = sessionCalendar(item, now)!
  assert.equal(file.split('\r\n').filter((l) => l === 'END:VEVENT').length, 1)
  for (const line of file.split('\r\n')) assert.ok(Buffer.byteLength(line, 'utf8') <= 75)
  assert.equal(Buffer.from(file, 'utf8').toString('utf8'), file)
  const unfolded = file.replace(/\r\n /g, '')
  assert.ok(unfolded.includes('SUMMARY:' + 'Приключение 🐉'.repeat(25) + '\\;comma\\,slash\\\\end'))
  assert.ok(unfolded.includes('DESCRIPTION:First\\nATTENDEE:evil\\nEND:VEVENT\\nLast'))
  assert.doesNotMatch(file, /\r\nATTENDEE:/)
  assert.doesNotMatch(file, /\u0000/)
})
