import assert from 'node:assert/strict'
import { test } from 'node:test'
import { chatDiceExpression, diceDraft, rollChatDice } from '../src/lib/dnd/chat-dice'

test('editable drafts reject empty, fractional, excessive and non-numeric values', () => {
  for (const count of ['', '0', '-1', '21', '1.5', 'Infinity', '2e1'])
    assert.equal(diceDraft(count, '0').validCount, false)
  for (const bonus of ['', '-', '+', '1.5', '101', '-101', 'NaN', '1e2'])
    assert.equal(diceDraft('1', bonus).validModifier, false)
  assert.equal(diceDraft('20', '-100').valid, true)
  assert.equal(diceDraft(' 1 ', '+100').valid, true)
})
test('normal dice sum all raw rolls and apply the bonus once', () => {
  const samples = [0, 0.999]
  const roll = rollChatDice(6, 2, -2, 'normal', () => samples.shift()!)!
  assert.deepEqual(roll.rolls, [1, 6])
  assert.equal(roll.total, 5)
  assert.equal(roll.expression, '2d6-2')
  assert.equal(chatDiceExpression(100, 20, 0), '20d100')
})
test('advantage and disadvantage preserve both results and apply bonus once', () => {
  for (const [mode, expected] of [
    ['advantage', 23],
    ['disadvantage', 4],
  ] as const) {
    const samples = [0, 0.999]
    const roll = rollChatDice(20, 1, 3, mode, () => samples.shift()!)!
    assert.deepEqual(roll.rolls, [1, 20])
    assert.equal(roll.total, expected)
    assert.equal(roll.advantage, mode === 'advantage')
    assert.equal(roll.disadvantage, mode === 'disadvantage')
    assert.equal(roll.expression, mode === 'advantage' ? '1d20adv+3' : '1d20dis+3')
  }
  assert.equal(rollChatDice(20, 1, -100, 'advantage', () => 0.5)!.total, -89)
})
test('invalid parameters fail before randomness, and malformed random samples fail closed', () => {
  let called = false
  const random = () => {
    called = true
    return 0
  }
  for (const [sides, count, bonus] of [
    [3, 1, 0],
    [20, 0, 0],
    [20, 21, 0],
    [6, 1.5, 0],
    [20, 1, Infinity],
    [20, 1, 101],
  ])
    assert.equal(rollChatDice(sides, count, bonus, 'normal', random), null)
  assert.equal(rollChatDice(6, 1, 0, 'advantage', random), null)
  assert.equal(rollChatDice(20, 2, 0, 'disadvantage', random), null)
  assert.equal(called, false)
  for (const sample of [NaN, Infinity, -1, 1])
    assert.equal(
      rollChatDice(20, 1, 0, 'normal', () => sample),
      null
    )
})
