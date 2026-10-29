# Character HP and level-up validation — 2026-10-29

This change adds application-side validation, not a coordinated HP transaction or a migration. Source baseline: main 303066d8f970944bdb8cc4aed4244d3439e35b26. Follow-up rules and writer coordination remain in the preserved backlog.

## Changed behavior

- Creation and full character JSON saves reject malformed HP before INSERT/CAS. The shared character-save helper also refuses to carry invalid HP through spell/inventory/rest and other actions that reach that helper.
- Required current/max HP must be integers: max is 1–2147483647, current is 0–max. Provided temporary HP must be an integer in 0–2147483647. Legacy missing temp is accepted as zero by the reader; missing current/max are never invented. No saved player data is automatically repaired.
- Manual HP patches accept only current/max/temp with integer values; null, arrays, empty patches, unknown keys, negative values, fractions, NaN and infinities are rejected. A max-only reduction retains the prior clamp of existing current HP. An explicitly out-of-range current value is rejected.
- Level-up requires an integer saved level 1–19, a supported canonical base class/compatible subclass, valid HP and integer ability scores 1–30. Only average/roll methods are accepted. An invalid request cannot consume randomness or reach CAS.
- ASI validates the existing app schedule: exactly two points at an ASI level, zero otherwise, only six known abilities, nonnegative integer increments and no increased score above 20. Existing scores above 20 can remain unchanged. The helper no longer silently truncates an illegal increase.
- HP gain must fit the class die/CON range and PostgreSQL integer bounds. A roll request is rejected before drawing if any possible outcome would overflow. Successful writes keep the original JSON as the CAS expectation; a stale save does not log success or revalidate.
- The level-up dialog validates before reading malformed nested fields, gives separate level/class/HP/ability messages in English/Russian, displays a stable roll range instead of drawing a random preview, and shows exact average HP. +2 choices at score 19 are disabled; selected ASI displays the resulting score. Actual rolls occur only after server-side request validation on submission.

## Verification

`npm run test:characters` runs the pure HP/progression matrix, all 12 class die outcomes, numeric boundaries/overflow, strict ASI cases, real server-action code with a recording mock database boundary, and static React rendering of the real dialog. It includes the existing identity/display/SRD regressions. CI runs this suite before lint/typecheck/build. No credentials, network or live character rows are used.

Action tests verify rejected requests produce no INSERT/RPC/log/revalidation, valid create/full JSON/manual HP/level-up writes retain their expected data, CAS failure is not success, and unauthorized level-up does not write. The render tests prove no UI randomness and an alert instead of a calculation/crash for invalid saved data; they do not establish authenticated browser/JWT acceptance.

## Deliberately separate work

These guards do not coordinate character HP with linked token rows, block authorized direct REST/SQL writers, fix the installed HP RPC or reconcile migration history. Their current defects remain reproduced by the isolated PostgreSQL baseline. B05's coordinated writer design and B04's authority reconciliation remain priorities.

This validation change preserves existing level-up healing/spell-slot behavior and the app's shared ASI schedule. It does not add feats, class-specific extra ASI levels, retroactive HP changes from a CON increase, or safe recovery of legacy character data. Those rules require a separate, explicit progression change with preview and server tests; do not claim full D&D rules conformance from these checks.
