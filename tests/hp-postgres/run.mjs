import assert from 'node:assert/strict'
import test from 'node:test'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { startCluster } from './cluster.mjs'
import { prepareBundledLinux } from './prepare-binaries.mjs'

// This is a dedicated test process. Remove names without reading their values;
// libpq/pg defaults (including PGOPTIONS/PGSERVICE/PGPASSWORD) are irrelevant.
for (const key of Object.keys(process.env))
  if (key.toUpperCase().startsWith('PG')) delete process.env[key]

let binDir
if (process.argv.length === 4 && process.argv[2] === '--bin-dir') {
  binDir = path.resolve(process.argv[3])
} else if (process.argv.length === 2) {
  if (!['win32', 'linux'].includes(process.platform) || process.arch !== 'x64')
    throw new Error('Pass --bin-dir with PostgreSQL 17 binaries on this platform')
  const binaries = await import(
    `@embedded-postgres/${process.platform === 'win32' ? 'windows' : 'linux'}-x64`
  )
  binDir = path.dirname(binaries.postgres)
  if (process.platform === 'linux') await prepareBundledLinux(path.resolve(binDir, '../..'))
} else {
  throw new Error('Only --bin-dir PATH is accepted; database URLs/hosts are not supported')
}

const fixture = await readFile(new URL('./fixture.sql', import.meta.url))
const provenance = JSON.parse(await readFile(new URL('./provenance.json', import.meta.url), 'utf8'))
assert.equal(createHash('sha256').update(fixture).digest('hex'), provenance.fixture_sha256)
const lab = await startCluster(binDir)
const id = (group, value) => `${group}0000000-0000-4000-8000-${String(value).padStart(12, '0')}`
const U = {
  dm: id(0, 1),
  owner: id(0, 2),
  coowner: id(0, 3),
  outsider: id(0, 4),
  member: id(0, 5),
  fakeDm: id(0, 6),
}
const C = id(1, 1),
  foreignC = id(1, 2),
  S = id(2, 1),
  S2 = id(2, 2),
  foreignS = id(2, 3)
const H = id(3, 1),
  foreignH = id(3, 2),
  T = id(4, 1),
  T2 = id(4, 2),
  T3 = id(4, 3)
const initial = { hp: { current: 20, max: 20 }, notes: 'preserve-me' }
const results = []
async function actor(user, role = 'authenticated') {
  assert.ok(['authenticated', 'anon', 'service_role'].includes(role))
  const client = await lab.connect('hp-lab-actor')
  await client.query(`SET ROLE ${role}`)
  await client.query("SELECT set_config('request.jwt.claim.sub', $1, false)", [user ?? ''])
  return client
}
async function reset(data = initial) {
  await lab.db.query('TRUNCATE public.campaigns CASCADE')
  await lab.db.query('TRUNCATE hp_lab.outbox')
  for (const user of Object.values(U))
    await lab.db.query('INSERT INTO public.profiles VALUES ($1) ON CONFLICT DO NOTHING', [user])
  await lab.db.query(
    "INSERT INTO public.campaigns(id,name,owner_id) VALUES ($1,'local A',$2),($3,'local B',$4)",
    [C, U.dm, foreignC, U.outsider]
  )
  for (const user of [U.owner, U.coowner, U.member, U.fakeDm])
    await lab.db.query(
      'INSERT INTO public.campaign_members(campaign_id,user_id,role) VALUES ($1,$2,$3)',
      [C, user, user === U.fakeDm ? 'dm' : 'player']
    )
  await lab.db.query(
    "INSERT INTO public.scenes(id,campaign_id,name) VALUES ($1,$2,'local scene'),($3,$2,'local sibling scene'),($4,$5,'foreign scene')",
    [S, C, S2, foreignS, foreignC]
  )
  await lab.db.query(
    "INSERT INTO public.characters(id,campaign_id,user_id,name,data_json) VALUES ($1,$2,$3,'local character',$4),($5,$6,$7,'foreign character',$8)",
    [H, C, U.owner, data, foreignH, foreignC, U.outsider, initial]
  )
  await lab.db.query(
    "INSERT INTO public.tokens(id,scene_id,campaign_id,character_id,owner_id,name,hp_current,hp_max) VALUES ($1,$2,$3,$4,$5,'local target',20,20),($6,$7,$3,$4,$5,'local sibling',20,20)",
    [T, S, C, H, U.owner, T2, S2]
  )
  for (const token of [T, T2])
    await lab.db.query(
      'INSERT INTO public.token_owners(token_id,user_id,campaign_id,added_by) VALUES ($1,$2,$3,$4)',
      [token, U.coowner, C, U.dm]
    )
}
const hp = (client, amount = 3, token = T, scene = S, mode = 'damage', expected = null) =>
  client.query('SELECT hp_lab.captured_apply_token_hp($1,$2,$3,$4,$5) AS hp', [
    token,
    scene,
    amount,
    mode,
    expected,
  ])
async function snapshot() {
  const characters = (
    await lab.db.query('SELECT id,data_json,updated_at FROM public.characters ORDER BY id')
  ).rows
  const tokens = (
    await lab.db.query(
      'SELECT id,character_id,hp_current,hp_max,updated_at FROM public.tokens ORDER BY id'
    )
  ).rows
  const outbox = (
    await lab.db.query(
      'SELECT * FROM hp_lab.outbox ORDER BY topic,operation,new_row::text,old_row::text'
    )
  ).rows
  return { characters, tokens, outbox }
}
async function state() {
  return {
    hp: (await lab.db.query('SELECT data_json FROM public.characters WHERE id=$1', [H])).rows[0]
      ?.data_json,
    tokens: (await lab.db.query('SELECT hp_current FROM public.tokens ORDER BY id')).rows.map(
      (r) => r.hp_current
    ),
  }
}
async function rejectedWithoutWrites(client, call, code) {
  const before = await snapshot()
  await assert.rejects(call, (error) => error.code === code)
  assert.deepEqual(await snapshot(), before)
}
const pending = (promise) =>
  promise.then(
    (value) => ({ value }),
    (error) => ({ error })
  )
async function blockedBy(waiter, blocker) {
  const waiterId = (await waiter.query('SELECT pg_backend_pid() AS pid')).rows[0].pid
  const blockerId = (await blocker.query('SELECT pg_backend_pid() AS pid')).rows[0].pid
  return { waiterId, blockerId }
}
async function waitForBlock({ waiterId, blockerId }) {
  const deadline = Date.now() + 4000
  do {
    const row = (
      await lab.db.query('SELECT $2::int = ANY(pg_blocking_pids($1::int)) AS blocked', [
        waiterId,
        blockerId,
      ])
    ).rows[0]
    if (row.blocked) return
    await new Promise((resolve) => setTimeout(resolve, 20))
  } while (Date.now() < deadline)
  assert.fail('Independent sessions did not overlap on the expected lock')
}
async function scenario(t, name, body) {
  await t.test(name, async () => {
    await reset()
    const started = Date.now()
    try {
      await body()
      results.push({ name, status: 'passed', ms: Date.now() - started })
    } catch (error) {
      results.push({ name, status: 'failed', code: error.code ?? null })
      throw error
    }
  })
}

try {
  await test(
    'captured HP behavior in a newly owned local PostgreSQL 17 cluster',
    { timeout: 120000 },
    async (t) => {
      await scenario(
        t,
        'fixture preserves captured table/policy/custom-trigger counts and HP ACL',
        async () => {
          const row = (
            await lab.db.query(`SELECT
        (SELECT count(*)::int FROM pg_policies WHERE schemaname='public') AS policies,
        (SELECT count(*)::int FROM pg_trigger WHERE NOT tgisinternal AND tgrelid IN (SELECT oid FROM pg_class WHERE relnamespace='public'::regnamespace)) AS triggers,
        (SELECT count(*)::int FROM pg_class WHERE relnamespace='public'::regnamespace AND relkind='r' AND relrowsecurity) AS rls_tables,
        has_function_privilege('authenticated','hp_lab.captured_apply_token_hp(uuid,uuid,integer,text,integer)','EXECUTE') AS authenticated,
        has_function_privilege('anon','hp_lab.captured_apply_token_hp(uuid,uuid,integer,text,integer)','EXECUTE') AS anon,
        has_function_privilege('service_role','hp_lab.captured_apply_token_hp(uuid,uuid,integer,text,integer)','EXECUTE') AS service_role,
        (SELECT rolsuper FROM pg_roles WHERE rolname='postgres') AS superuser,
        (SELECT rolbypassrls FROM pg_roles WHERE rolname='postgres') AS bypass_rls`)
          ).rows[0]
          assert.deepEqual(row, {
            policies: 30,
            triggers: 7,
            rls_tables: 6,
            authenticated: true,
            anon: false,
            service_role: false,
            superuser: false,
            bypass_rls: true,
          })
          for (const routine of provenance.routines) {
            const definition = (
              await lab.db.query('SELECT pg_get_functiondef($1::regprocedure) AS definition', [
                routine.local_signature,
              ])
            ).rows[0].definition
            const capturedName = routine.captured_signature.split('(')[0]
            const localName = routine.local_signature.split('(')[0]
            const restored = definition
              .replace(`FUNCTION ${localName}(`, `FUNCTION public.${capturedName}(`)
              .split(/\r?\n/)
              .map((line) => line.trim())
              .join('\n')
              .trim()
            assert.equal(
              createHash('sha256').update(restored).digest('hex'),
              routine.normalized_definition_sha256
            )
          }
        }
      )
      await scenario(
        t,
        'fixture refuses a missing isolation marker before executing its DDL',
        async () => {
          await lab.db.query("SELECT set_config('hp_lab.isolated', '', false)")
          try {
            await assert.rejects(
              () => lab.db.query(fixture.toString('utf8')),
              (error) =>
                error.code === 'P0001' &&
                error.message === 'Refusing non-isolated HP fixture target'
            )
          } finally {
            await lab.db.query("SELECT set_config('hp_lab.isolated', current_database(), false)")
          }
        }
      )
      for (const key of ['owner', 'coowner', 'dm'])
        await scenario(t, `authorization: ${key} can change selected token/character`, async () => {
          const client = await actor(U[key])
          assert.equal((await hp(client)).rows[0].hp, 17)
          assert.deepEqual(await state(), {
            hp: { ...initial, hp: { current: 17, max: 20 } },
            tokens: [17, 20],
          })
        })
      for (const key of ['member', 'outsider', 'fakeDm'])
        await scenario(t, `authorization: ${key} is rejected without writes`, async () => {
          const client = await actor(U[key])
          await rejectedWithoutWrites(client, () => hp(client), '42501')
        })
      for (const role of ['anon', 'service_role'])
        await scenario(t, `ACL: ${role} cannot execute the copied HP routine`, async () => {
          const client = await actor(U.owner, role)
          await rejectedWithoutWrites(client, () => hp(client), '42501')
        })
      await scenario(
        t,
        'authorization: empty local identity is rejected without writes',
        async () => {
          const client = await actor(null)
          await rejectedWithoutWrites(client, () => hp(client), '42501')
        }
      )
      for (const [name, data, after] of [
        ['hp', {}, {}],
        ['current', { hp: { max: 20 } }, { hp: { max: 20 } }],
        ['max', { hp: { current: 20 } }, { hp: { current: 17 } }],
      ])
        await scenario(
          t,
          `reproduces gap: missing ${name} skips guards and commits incomplete HP`,
          async () => {
            await reset(data)
            const client = await actor(U.owner)
            assert.equal((await hp(client)).rows[0].hp, 17)
            assert.deepEqual(await state(), { hp: after, tokens: [17, 20] })
          }
        )
      for (const [name, data] of [
        ['JSON null', { hp: null }],
        ['null current', { hp: { current: null, max: 20 } }],
        ['string current', { hp: { current: '20', max: 20 } }],
        ['fraction', { hp: { current: 19.5, max: 20 } }],
        ['negative', { hp: { current: -1, max: 20 } }],
        ['overflow', { hp: { current: 2147483648, max: 2147483648 } }],
        ['zero max', { hp: { current: 0, max: 0 } }],
        ['drift', { hp: { current: 19, max: 20 } }],
      ])
        await scenario(t, `validation: ${name} fails without writes`, async () => {
          await reset(data)
          const client = await actor(U.owner)
          await rejectedWithoutWrites(client, () => hp(client), '22023')
        })
      for (const [name, amount, mode, expected, code] of [
        ['negative amount', -1, 'damage', null, '22023'],
        ['oversized amount', 1000001, 'damage', null, '22023'],
        ['unknown mode', 3, 'invalid', null, '22023'],
        ['set without expected', 3, 'set', null, '22023'],
        ['stale expected', 3, 'damage', 19, '40001'],
        ['fractional input', 1.5, 'damage', null, '22P02'],
      ])
        await scenario(t, `request: ${name} fails without writes`, async () => {
          const client = await actor(U.owner)
          await rejectedWithoutWrites(client, () => hp(client, amount, T, S, mode, expected), code)
        })
      await scenario(
        t,
        'reproduces gap: an already drifted sibling is neither rejected nor updated',
        async () => {
          await lab.db.query('UPDATE public.tokens SET hp_current=4 WHERE id=$1', [T2])
          assert.equal((await hp(await actor(U.owner))).rows[0].hp, 17)
          assert.deepEqual((await state()).tokens, [17, 4])
        }
      )
      await scenario(
        t,
        'reproduces gap: foreign-campaign sibling is permitted by FKs and ignored',
        async () => {
          await lab.db.query(
            "INSERT INTO public.tokens(id,scene_id,campaign_id,character_id,owner_id,name,hp_current,hp_max) VALUES ($1,$2,$3,$4,$5,'foreign sibling',20,20)",
            [T3, foreignS, foreignC, H, U.outsider]
          )
          assert.equal((await hp(await actor(U.owner))).rows[0].hp, 17)
          assert.deepEqual((await state()).tokens, [17, 20, 20])
        }
      )
      await scenario(
        t,
        'validation: selected link to foreign character fails without writes',
        async () => {
          await lab.db.query('UPDATE public.tokens SET character_id=$1 WHERE id=$2', [foreignH, T])
          const client = await actor(U.owner)
          await rejectedWithoutWrites(client, () => hp(client), 'P0002')
        }
      )
      await scenario(
        t,
        'rollback: injected character-write failure rolls back token, timestamp and outbox',
        async () => {
          await lab.db
            .query(`CREATE FUNCTION hp_lab.reject_character_write() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'local injected failure'; END $$;
        CREATE TRIGGER hp_lab_injected_failure BEFORE UPDATE ON public.characters FOR EACH ROW EXECUTE FUNCTION hp_lab.reject_character_write()`)
          try {
            const client = await actor(U.owner)
            await rejectedWithoutWrites(client, () => hp(client), 'P0001')
          } finally {
            await lab.db.query(
              'DROP TRIGGER hp_lab_injected_failure ON public.characters; DROP FUNCTION hp_lab.reject_character_write()'
            )
          }
        }
      )
      await scenario(
        t,
        'reproduces gap: owner direct token UPDATE bypasses character/sibling HP',
        async () => {
          const client = await actor(U.owner)
          assert.equal(
            (await client.query('UPDATE public.tokens SET hp_current=9 WHERE id=$1', [T])).rowCount,
            1
          )
          assert.deepEqual(await state(), { hp: initial, tokens: [9, 20] })
        }
      )
      await scenario(
        t,
        'reproduces gap: character CAS accepts independent HP and preserves stale-CAS rejection',
        async () => {
          const client = await actor(U.owner)
          const next = { ...initial, hp: { current: 7, max: 20 }, notes: 'new note' }
          const cas = (expected, value) =>
            client.query(
              'SELECT hp_lab.captured_update_character_data_cas($1,$2,$3,$4) AS applied',
              [H, C, expected, value]
            )
          assert.equal((await cas(initial, next)).rows[0].applied, true)
          const before = await snapshot()
          assert.equal((await cas(initial, { ...initial, notes: 'stale' })).rows[0].applied, false)
          assert.deepEqual(await snapshot(), before)
          assert.deepEqual(await state(), { hp: next, tokens: [20, 20] })
        }
      )
      await scenario(
        t,
        'RLS: unrelated member direct UPDATE changes zero token/character rows',
        async () => {
          const client = await actor(U.member),
            before = await snapshot()
          assert.equal(
            (await client.query('UPDATE public.tokens SET hp_current=9 WHERE id=$1', [T])).rowCount,
            0
          )
          assert.equal(
            (await client.query("UPDATE public.characters SET data_json='{}' WHERE id=$1", [H]))
              .rowCount,
            0
          )
          assert.deepEqual(await snapshot(), before)
        }
      )
      await scenario(
        t,
        'RLS: token_owners table UPDATE grant does not supply a missing UPDATE policy',
        async () => {
          const client = await actor(U.dm)
          assert.equal(
            (
              await client.query('UPDATE public.token_owners SET added_by=$1 WHERE token_id=$2', [
                U.owner,
                T,
              ])
            ).rowCount,
            0
          )
        }
      )
      await scenario(t, 'FK: character owner deletion unlinks all siblings', async () => {
        const client = await actor(U.owner)
        assert.equal(
          (await client.query('DELETE FROM public.characters WHERE id=$1', [H])).rowCount,
          1
        )
        assert.deepEqual(
          (await lab.db.query('SELECT character_id FROM public.tokens ORDER BY id')).rows.map(
            (r) => r.character_id
          ),
          [null, null]
        )
      })
      await scenario(
        t,
        'concurrency: same-token damages serialize; sibling still remains stale',
        async () => {
          const a = await actor(U.owner),
            b = await actor(U.coowner),
            ids = await blockedBy(b, a)
          await a.query('BEGIN')
          await b.query('BEGIN')
          try {
            assert.equal((await hp(a, 3)).rows[0].hp, 17)
            const second = pending(hp(b, 4))
            await waitForBlock(ids)
            await a.query('COMMIT')
            const result = await second
            assert.ifError(result.error)
            assert.equal(result.value.rows[0].hp, 13)
            await b.query('COMMIT')
            assert.deepEqual(await state(), {
              hp: { ...initial, hp: { current: 13, max: 20 } },
              tokens: [13, 20],
            })
          } finally {
            await a.query('ROLLBACK')
            await b.query('ROLLBACK')
          }
        }
      )
      await scenario(
        t,
        'concurrency: damage to a sibling waits then fails on stale selected-token HP',
        async () => {
          const a = await actor(U.owner),
            b = await actor(U.coowner),
            ids = await blockedBy(b, a)
          await a.query('BEGIN')
          await b.query('BEGIN')
          try {
            await hp(a, 3)
            const second = pending(hp(b, 4, T2, S2))
            await waitForBlock(ids)
            await a.query('COMMIT')
            assert.equal((await second).error?.code, '22023')
            await b.query('ROLLBACK')
            assert.deepEqual(await state(), {
              hp: { ...initial, hp: { current: 17, max: 20 } },
              tokens: [17, 20],
            })
          } finally {
            await a.query('ROLLBACK')
            await b.query('ROLLBACK')
          }
        }
      )
      await scenario(
        t,
        'reproduces lock gap: unauthorized member waits on token before permission rejection',
        async () => {
          const a = await lab.connect('hp-lab-lock-holder'),
            b = await actor(U.member),
            ids = await blockedBy(b, a)
          const before = await snapshot()
          await a.query('BEGIN')
          try {
            await a.query('SELECT id FROM public.tokens WHERE id=$1 FOR UPDATE', [T])
            const denied = pending(hp(b))
            await waitForBlock(ids)
            await a.query('COMMIT')
            assert.equal((await denied).error?.code, '42501')
            assert.deepEqual(await snapshot(), before)
          } finally {
            await a.query('ROLLBACK')
          }
        }
      )
      await scenario(
        t,
        'reproduces link race: FK waits for character lock then admits a stale new sibling',
        async () => {
          const a = await actor(U.owner),
            b = await actor(U.dm),
            ids = await blockedBy(b, a)
          await a.query('BEGIN')
          await b.query('BEGIN')
          try {
            await hp(a, 3)
            const inserted = pending(
              b.query(
                "INSERT INTO public.tokens(id,scene_id,campaign_id,character_id,name,hp_current,hp_max) VALUES ($1,$2,$3,$4,'late sibling',20,20)",
                [T3, S, C, H]
              )
            )
            await waitForBlock(ids)
            await a.query('COMMIT')
            assert.ifError((await inserted).error)
            await b.query('COMMIT')
            assert.deepEqual(await state(), {
              hp: { ...initial, hp: { current: 17, max: 20 } },
              tokens: [17, 20, 20],
            })
          } finally {
            await a.query('ROLLBACK')
            await b.query('ROLLBACK')
          }
        }
      )
    }
  )
} finally {
  await lab.stop()
  const dir = new URL('./results/', import.meta.url)
  await mkdir(dir, { recursive: true })
  await writeFile(
    new URL('latest.json', dir),
    JSON.stringify(
      {
        captured_baseline_only: true,
        runtime: lab.version,
        captured_runtime: provenance.source_server,
        fixture_sha256: provenance.fixture_sha256,
        local_cluster_stopped: true,
        passed: results.filter((r) => r.status === 'passed').length,
        failed: results.filter((r) => r.status === 'failed').length,
        cases: results,
      },
      null,
      2
    ) + '\n'
  )
  console.log(`Local cluster stopped. Synthetic data/logs retained at ${lab.directory}`)
  console.log(`Report: ${fileURLToPath(new URL('latest.json', dir))}`)
}
