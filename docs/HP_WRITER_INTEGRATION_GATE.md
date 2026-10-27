# HP writer integration blockers

This checklist is **not proof of transactional consistency**. The adjacent CI test merely alerts reviewers to changes in known server actions and feature-flag gates; it does not find every possible writer.

| Entry point | Current behavior | Required before atomic rollout |
|---|---|---|
| `damageToken` | DEV-only optional RPC; otherwise legacy token + character path | All linked-token combat writes must use compatible lock protocol |
| `updateCharacterHP` | Character JSON CAS; may leave linked token stale | Transactionally synchronize / reject linked-token edits |
| `rollDeathSave` | Natural 20 changes character HP only | Transactional character/token HP update |
| `longRest` | Restores character HP only, along with resources | Atomic linked-token sync without clobbering resources |
| `levelUp` | Full-heal character only; warns on linked token | Atomic level + all linked tokens |
| `updateCharacter` | Can accept full `data_json` (including HP) | Cannot bypass coordinated HP protocol |
| `saveCharacterData` | Whole-document JSON CAS for other actions | Ensure stale-data rejection and no HP bypass |

**Stop condition:** Do not enable `ATOMIC_TOKEN_HP_RPC_ENABLED` or remove the review-only SQL safety barrier until all paths are inventoried and either coordinated transactionally or explicitly blocked for linked characters. Validate two tokens per character, concurrent level-up/damage, multiple writers, permission checks and rollbacks with disposable DEV fixtures.

Only tests and documentation in this PR; no database changes.
