import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readQuestObjectives } from '../src/lib/quest-objectives'
import { toEntityLibraryCard } from '../src/lib/quest-journal'

const goal = { id: 'one', text: 'Find the tower', done: false }
test('objectives preserve explicit completion, legacy empty state and reject malformed data', () => {
  assert.deepEqual(readQuestObjectives(undefined), [])
  assert.deepEqual(readQuestObjectives([goal]), [goal])
  for (const input of [
    null,
    {},
    'old',
    [null],
    [{ ...goal, done: 'false' }],
    [{ ...goal, text: ' ' }],
    [{ ...goal, text: 'x'.repeat(201) }],
    [{ ...goal, id: 'x.y' }],
    [goal, goal],
    Array(21).fill(goal),
    [{ ...goal, secret: 'unexpected' }],
  ])
    assert.equal(readQuestObjectives(input), null)
})
test('library sends only objective counts, never text, IDs or malformed progress', () => {
  const row = {
    id: 'q',
    type: 'quest' as const,
    name: 'Quest',
    description: '',
    updated_at: '',
    is_visible_to_players: true,
    quest_objectives: [goal, { ...goal, id: 'two', done: true }],
  }
  const result = toEntityLibraryCard(row)
  assert.deepEqual(result.quest?.progress, { done: 1, total: 2 })
  assert.equal(JSON.stringify(result).includes(goal.text), false)
  assert.equal(toEntityLibraryCard({ ...row, quest_objectives: 'old' }).quest?.progress, undefined)
  assert.equal(toEntityLibraryCard({ ...row, type: 'npc' }).quest, undefined)
})
