import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const characters = readFileSync('src/lib/actions/characters.ts', 'utf8')
const combat = readFileSync('src/lib/actions/combat.ts', 'utf8')

function actionBody(source: string, name: string): string {
  const start = source.indexOf('export async function ' + name + '(')
  assert.ok(start >= 0, name + ' action must exist')
  const next = source.indexOf('\nexport async function ', start + 1)
  return source.slice(start, next < 0 ? undefined : next)
}

test('HP mutation entrypoints remain visible to atomic-HP rollout audit', () => {
  for (const name of ['updateCharacterHP', 'rollDeathSave', 'longRest', 'levelUp']) {
    const body = actionBody(characters, name)
    assert.match(body, /saveCharacterData\(/, name + ' must be re-audited before RPC activation')
  }
  assert.match(actionBody(combat, 'damageToken'), /ATOMIC_TOKEN_HP_RPC_ENABLED/)
  assert.match(actionBody(combat, 'damageToken'), /apply_token_hp_atomic/)
})

test('atomic HP remains opt-in, DEV-only and never allowed on Vercel production', () => {
  const body = actionBody(combat, 'damageToken')
  assert.match(body, /process\.env\.ATOMIC_TOKEN_HP_RPC_ENABLED === 'true'/)
  assert.match(body, /process\.env\.ATOMIC_TOKEN_HP_DEV_CONFIRMED !== 'true'/)
  assert.match(body, /process\.env\.VERCEL_ENV === 'production'/)
  assert.match(body, /yoondivyeueyrtgeldja\.supabase\.co/)
})
