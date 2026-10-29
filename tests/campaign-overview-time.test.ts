import { test } from 'node:test'
import assert from 'node:assert/strict'
import { campaignRelativeTime } from '../src/lib/campaign-overview-time'

const now = Date.parse('2026-10-29T08:00:00Z')
test('relative activity labels follow the interface language and elapsed units', () => {
  assert.equal(campaignRelativeTime('2026-10-29T07:58:00Z', 'en', now), '2 minutes ago')
  assert.equal(campaignRelativeTime('2026-10-29T07:58:00Z', 'ru', now), '2 минуты назад')
  assert.equal(campaignRelativeTime('2026-10-29T06:00:00Z', 'en', now), '2 hours ago')
  assert.equal(campaignRelativeTime('2026-10-28T08:00:00Z', 'en', now), 'yesterday')
})
test('older activity includes the year and uses a stable UTC calendar date', () => {
  assert.equal(
    campaignRelativeTime('2025-10-01T23:55:00Z', 'en', now),
    new Intl.DateTimeFormat('en', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(Date.parse('2025-10-01T23:55:00Z'))
  )
})
test('invalid dates stay absent and future clock skew does not claim future activity', () => {
  assert.equal(campaignRelativeTime('invalid', 'en', now), null)
  assert.equal(
    campaignRelativeTime('2026-10-29T09:00:00Z', 'en', now),
    campaignRelativeTime('2026-10-29T08:00:00Z', 'en', now)
  )
  assert.equal(campaignRelativeTime('2026-10-29T08:00:00Z', 'en', NaN), null)
})
