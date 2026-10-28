# Local PostgreSQL HP baseline — 2026-10-28

**The captured HP defects are reproducible in isolated PostgreSQL. Nothing is
fixed or deployed by this checkpoint.** The new suite is in
`tests/hp-postgres/`; it never accepts an existing database or remote URL.

Source: main `36e406442b10324d9cadf70c1c84ae53d7684e5a`, plus the catalog
evidence documented in [Draft #239](https://github.com/DoctorStrangeSH/dm-workspace/pull/239).
Six table shapes, 30 policies, seven custom triggers and three renamed routine
copies are reconstructed with documented stubs. Local routine fingerprints
are checked against the captured normalized definitions. Runtime: PostgreSQL
17.10, compared with captured DEV 17.11. No new remote query was needed.

Local verification passed **41 scenarios** (Node reports 42 tests including the
parent). The owned cluster stopped successfully. The retained synthetic summary
is `docs/verification/hp_local_postgres_baseline_results.json`; ESLint also
passed for the three runner modules. CI is checked separately on the published
head; a local pass is not a claim about GitHub or deployment state.

## Verified outcomes

- Missing character `hp`/`current`/`max` can commit a token HP change with
  incomplete or unchanged character HP. This extends the earlier constant-only
  evidence to execution of the renamed local copy.
- Owner, additional token owner and campaign owner/DM pass the copied function's
  authorization. An unrelated member, outsider, membership merely labeled DM,
  missing identity, anon and service_role are rejected as expected.
- A selected-token change leaves other linked tokens stale. Existing sibling
  drift is ignored. Independent FKs admit a foreign-campaign sibling too.
- Two real connections to the same token serialize damages 3 and 4 from 20 to
  13 on that token and character, but the sibling remains at 20. On different
  siblings, the second damage waits and then fails the agreement check.
- A new linked-token INSERT waits for the character lock, then commits stale
  supplied HP after damage completes. Locking alone cannot fix a token creator
  that does not reread canonical HP within the coordinated protocol.
- An unauthorized member waits on an already locked token before permission
  rejection. The function locks before checking that permission.
- Direct authorized token UPDATE and character CAS each bypass coordination.
  Stale CAS still returns false without writes. Character deletion unlinks
  siblings through the captured FK behavior.
- Rejected malformed/range/stale requests and an injected failure during the
  character UPDATE roll back both rows, timestamps and local outbox events.

Lock overlap is verified with `pg_blocking_pids` between independent backend
PIDs. Identity is simulated with local role/UUID settings; it is not a real
authenticated HTTP session. The Realtime sink proves only local transactional
outbox rollback, not Realtime delivery. Full limitations and reproducible run
instructions are in `tests/hp-postgres/README.md` and `provenance.json`.

## Next safe action

Prepare a test-only coordinated writer design with null-safe validation,
permission checks before sensitive locks, post-lock authorization/relationship
revalidation, canonical character locking and deterministic sibling locks.
Include token creation/relink/unlink/delete, full character CAS and every
existing direct writer; define how grants prevent bypass at cutover. Then test
safe outcomes and link/authorization races locally. Separately map migration
ledger entries to installed effects before proposing any history repair.

Keep #163–#172, #182, #238 and this baseline unmerged/unapplied pending review.
Do not invoke installed HP RPC, dispatch the manual HP workflow, mutate
Supabase, or touch Production. Green baseline tests mean bugs were reproduced;
they do not satisfy rollout gates in `HP_ATOMIC_ROLLOUT_CONTRACT.md`.
