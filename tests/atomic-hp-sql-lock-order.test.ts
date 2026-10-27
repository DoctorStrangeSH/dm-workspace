import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const combat = readFileSync('docs/sql/apply_token_hp_atomic.REVIEW.sql', 'utf8')
const creation = readFileSync('docs/sql/create_linked_token_atomic.REVIEW.sql', 'utf8')
const levelUp = readFileSync('docs/sql/level_up_character_tokens.REVIEW.sql', 'utf8')

function position(source: string, fragment: string): number {
  const index = source.indexOf(fragment)
  assert.ok(index >= 0, 'Missing SQL contract fragment: ' + fragment)
  return index
}

test('linked combat locks character before token after preflight', () => {
  const charLock = position(combat, 'FOR UPDATE;')
  const tokenLock = position(combat, 'FOR UPDATE OF t;')
  assert.ok(charLock < tokenLock)
  assert.match(combat, /Token link changed; retry/)
})

test('linked token creation locks character before INSERT, deriving HP from character', () => {
  assert.ok(position(creation, 'FOR UPDATE;') < position(creation, 'INSERT INTO public.tokens('))
  assert.match(creation, /v_char\.data_json->'hp'/)
  assert.match(creation, /v_hp_current, v_hp_max/)
  assert.doesNotMatch(creation, /p_hp_current|p_hp_max/)
})

test('level-up locks character before all tokens and sorts token locks', () => {
  assert.ok(position(levelUp, 'FOR UPDATE;') < position(levelUp, 'ORDER BY id FOR UPDATE'))
  assert.match(levelUp, /Linked token HP changed; retry/)
  assert.match(levelUp, /v_character\.data_json IS DISTINCT FROM p_expected_data/)
})

test('all SQL drafts remain disabled and never grant callers EXECUTE', () => {
  for (const sql of [creation, levelUp]) {
    assert.match(sql, /RAISE EXCEPTION 'REVIEW ONLY/)
    assert.doesNotMatch(sql, /GRANT EXECUTE/)
    assert.match(sql, /REVOKE ALL.*FROM authenticated/)
  }
})
