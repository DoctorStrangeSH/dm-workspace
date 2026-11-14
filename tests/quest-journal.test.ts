import assert from 'node:assert/strict'
import { test } from 'node:test'
import { questStatus, toEntityLibraryCard, type QuestLibraryRow } from '../src/lib/quest-journal'

const row: QuestLibraryRow = {
  id: 'q',
  type: 'quest',
  name: 'Quest',
  description: 'Goal',
  updated_at: '2026-11-14T00:00:00Z',
  is_visible_to_players: true,
}
test('quest summaries accept only known statuses, never invent active state', () => {
  for (const value of [null, undefined, '', 'ACTIVE', 'custom', 1, {}, ['active']])
    assert.equal(questStatus(value), 'unset')
  for (const value of ['active', 'completed', 'failed', 'paused'] as const)
    assert.equal(questStatus(value), value)
})
test('card projection preserves card identity and discards notes, full JSON and unexpected fields', () => {
  const input = {
    ...row,
    quest_status: 'completed',
    quest_giver: ' Alma ',
    quest_reward: '50 gold',
    quest_location: 'Tower',
    data_json: { notes: 'SECRET' },
    notes: 'SECRET',
  }
  const original = JSON.stringify(input)
  assert.deepEqual(toEntityLibraryCard(input), {
    ...row,
    quest: { status: 'completed', giver: 'Alma', reward: '50 gold', location: 'Tower' },
  })
  assert.equal(JSON.stringify(input), original)
  assert.equal(JSON.stringify(toEntityLibraryCard(input)).includes('SECRET'), false)
})
test('malformed summary fields stay absent, long strings are bounded, nonquests have no quest data', () => {
  const card = toEntityLibraryCard({
    ...row,
    quest_giver: {},
    quest_reward: ' ',
    quest_location: 'x'.repeat(900),
  })
  assert.equal(card.quest?.status, 'unset')
  assert.equal(card.quest?.giver, undefined)
  assert.equal(card.quest?.reward, undefined)
  assert.equal(card.quest?.location?.length, 500)
  assert.equal(
    toEntityLibraryCard({
      ...row,
      type: 'npc',
      quest_status: 'active',
      quest_reward: 'Hidden stats',
    }).quest,
    undefined
  )
})
