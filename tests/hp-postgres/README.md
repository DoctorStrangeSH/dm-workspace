# Isolated captured HP baseline

These tests reproduce the captured DEV behavior locally. A passing test named
`reproduces gap` means the defect was observed, **not fixed**. This suite is not
acceptance for a replacement HP function or permission to deploy anything.

Run from the repository root, with Node.js 22 or newer:

```sh
npm ci --prefix tests/hp-postgres --ignore-scripts --no-audit --no-fund
npm test --prefix tests/hp-postgres
```

The separate package pins `pg` and optional portable PostgreSQL 17.10 binaries
for Windows/Linux x64. It does not change application dependencies. Lifecycle
scripts are disabled; the runner restores only the bundled Linux library links
after checking their paths. Alternatively, use your installed PostgreSQL 17:

```sh
node tests/hp-postgres/run.mjs --bin-dir /absolute/path/to/postgresql/bin
```

Run as an ordinary user: PostgreSQL refuses to initialize a cluster as root.
No database URL, host, port or existing database is accepted. The runner removes
PG environment defaults, reads no `.env`, initializes a new temporary cluster,
binds TCP only to `127.0.0.1`, disables Unix sockets, and checks the server's
user/address/data-directory file identity before creating its random test DB.
The SQL fixture additionally checks that DB name, address and session marker.
Local trust authentication is used only for synthetic data in this temporary
cluster. No Supabase client, remote RPC or remote database is involved.

Normal completion/failure stops the owned cluster and retains its synthetic
data and log in the printed temporary directory. A hard process kill can bypass
cleanup; inspect that exact directory's `postmaster.pid` and stop only its
owned server with `pg_ctl -D <printed-directory>/data -m fast -w stop` before
removing anything. The runner never recursively deletes files. JSON results
are written to ignored `results/latest.json`. The PR-only CI job uploads that
summary, without credentials or user data; it has no manual dispatch trigger.

## Provenance and boundaries

`fixture.sql` replays six captured table shapes, constraints/indexes, 30 RLS
policies and seven custom triggers from the 2026-10-28 DEV read-only checkpoint
([report PR #239](https://github.com/DoctorStrangeSH/dm-workspace/pull/239)).
`provenance.json` records original evidence hashes, routine-definition hashes,
the fixture hash and all substitutions. Raw catalog evidence is retained outside
the checkout at `../audit-evidence/hp-dev-2026-10-28/` in this working session.

The three captured routines are renamed into `hp_lab`; their body logic is
unchanged apart from indentation. The suite compares PostgreSQL's returned
definitions with the captured normalized fingerprints. The HP copy is
`hp_lab.captured_apply_token_hp`; this does not invoke the installed DEV RPC.
Its local owner is `postgres NOSUPERUSER BYPASSRLS`, matching the relevant
privilege distinction. Tests use independent connections, `SET ROLE` and
synthetic UUIDs. Lock overlap is observed with `pg_blocking_pids`, rather than
assumed from timing.

Important substitutions: `auth.uid()` is a local UUID shim; profiles/entities
are ID-only FK stubs; only the two used campaign-role labels are modeled;
Realtime is a transactional local outbox. Live helper ACL and inherited
platform-role memberships were not captured/replayed completely. PostgreSQL
17.10 is used locally, while DEV reported 17.11. See `provenance.json` for the
complete list. These tests do not verify JWT/Auth, PostgREST, deployed schema
parity, Realtime delivery, the app, or production behavior.

## What this establishes

- Missing `hp`, `current` and `max` commit incomplete HP in the captured body.
- Selected-token damage leaves siblings stale, including foreign-campaign
  links admitted by independent FKs and an already drifted sibling.
- A new sibling can wait on the character FK lock, then insert stale HP after
  damage commits. Token creation must join the writer protocol.
- Unauthorized members wait on the token lock before permission rejection.
- Direct owner token updates and character CAS bypass shared HP coordination.
- Same-token damages serialize; damage to a different sibling waits and then
  fails because character/selected-token HP differ.
- Captured permission/validation failures and an injected character-write error
  leave token, character, timestamps and the local outbox unchanged.

Next: design and separately test a coordinated writer protocol, including
null-safe validation, authorization/revalidation, character-first locking,
all siblings, direct writers and link-set changes. Keep these reproductions
as historical baseline tests; replacement tests must assert safe outcomes.
