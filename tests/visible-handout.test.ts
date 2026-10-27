import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseVisibleHandout, parseDeletedHandoutId } from '../src/lib/realtime/visible-handout'

const campaignA = '11111111-1111-4111-8111-111111111111'
const campaignB = '22222222-2222-4222-8222-222222222222'
const handoutId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'

test('valid visible handout retains only allowlisted DTO fields', () => {
  assert.deepEqual(parseVisibleHandout({
    id: handoutId,
    campaign_id: campaignA,
    name: 'Safe map',
    is_visible: true,
    image_url: 'private/hidden.png',
    secret: 'Do not broadcast',
  }, campaignA), {
    id: handoutId,
    campaign_id: campaignA,
    name: 'Safe map',
    is_visible: true,
  })
})

test('rejects hidden, foreign-campaign and invalid handout payloads', () => {
  const base = { id: handoutId, campaign_id: campaignA, name: 'Map', is_visible: true }
  assert.equal(parseVisibleHandout({ ...base, is_visible: false }, campaignA), null)
  assert.equal(parseVisibleHandout({ ...base, campaign_id: campaignB }, campaignA), null)
  assert.equal(parseVisibleHandout({ ...base, id: 'not-a-uuid' }, campaignA), null)
  assert.equal(parseVisibleHandout({ ...base, name: 15 }, campaignA), null)
  assert.equal(parseVisibleHandout(null, campaignA), null)
  assert.equal(parseVisibleHandout('malformed', campaignA), null)
})

test('accepts only UUID deletion IDs', () => {
  assert.equal(parseDeletedHandoutId({ id: handoutId }), handoutId)
  assert.equal(parseDeletedHandoutId({ id: '../escape' }), null)
  assert.equal(parseDeletedHandoutId({ id: 1 }), null)
  assert.equal(parseDeletedHandoutId(null), null)
})
