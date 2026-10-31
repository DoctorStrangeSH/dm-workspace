import type { SessionWithRsvp } from '../../src/lib/types'
const base = {
  campaign_id: 'test',
  created_by: 'self',
  created_at: '2026-10-30T09:00:00Z',
  duration_minutes: 180,
  creator: { id: 'self', username: 'offline', display_name: 'Offline DM' },
  rsvps: [],
}
export const sessionFixtures: SessionWithRsvp[] = [
  {
    ...base,
    id: 'offline-future-session',
    title: 'Journey to the Everlasting Celestial Constellation and the Unbreakable Ancient Citadel',
    starts_at: '2099-07-10T14:30:00Z',
    description: 'Synthetic session plan.\n' + 'Unbroken'.repeat(30),
    rsvps: ['yes', 'yes', 'maybe', 'no'].map((status, i) => ({
      id: 'rsvp-' + i,
      session_id: 'offline-future-session',
      user_id: 'user-' + i,
      status: status as 'yes' | 'maybe' | 'no',
      updated_at: '2026-10-30T09:00:00Z',
    })),
  },
  {
    ...base,
    id: 'offline-past-session',
    title: 'Unbroken'.repeat(12),
    starts_at: '2000-01-01T09:00:00Z',
    description: 'A preserved past session.',
  },
  {
    ...base,
    id: 'offline-invalid-session',
    title: 'Invalid-date session',
    starts_at: 'invalid-date',
    description: null,
  },
]
Object.assign(window, { __sessionFixtures: sessionFixtures })
