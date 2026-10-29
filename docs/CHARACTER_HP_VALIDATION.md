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

## Creation regression — SRD hit dice (2026-10-29)

A reported first-level human sorcerer with CON15 displayed D62 HP. The real SRD adapter asserted that data.hit_die was numeric but left the D6 string unchanged, so the builder concatenated it with the +2 modifier. Parsing existed in srd-class-utils but this adapter did not use it.

The adapter now calls parseSrdHitDie before any arithmetic. Numeric dice, numeric strings and case-insensitive D6/D8/D10/D12 become numbers. Missing/malformed dice use the matching supported base class default (including prefixed SRD keys); the existing generic d8 fallback remains for unrecognized classes. Saved class/race keys, level handling, race bonuses and the builder's existing first-level formula are unchanged. This is not a correction of higher-level creation/progression rules or existing saved rows.

The new character-creation suite covers all 12 classes, both key forms, four valid die encodings, CON modifiers and missing/malformed dice. A recording test of the real create action verifies numeric 8/8 HP reaches INSERT, and that the old D62 payload reaches no write. Two offline browser scenarios drive the actual four-step CharacterWizard at desktop/mobile widths, reproduce the screenshot's point-buy values, assert HP8 on review, submit to an explicit in-memory create boundary and check numeric HP plus navigation. No authenticated live save or real player-data repair is claimed. Database access and game writes remain unchanged.


## Creation follow-up — canonical class and fallback catalog (2026-10-29)

The SRD adapter now emits the supported canonical base-class slug (for example, sorcerer rather than srd-2024_sorcerer). Previously a newly created SRD character could fail the strict level-up identity check, and create-action spellcasting setup missed prefixed casters. The create boundary independently normalizes supported SRD keys before checking subclass compatibility and configuring spellcasting. Unknown, missing and subclass-only class IDs are rejected before INSERT. Caller objects and existing rows are not rewritten; species and compatible subclass IDs retain their prior formats.

The wizard now resolves the same built-in RACES/CLASSES options that step 1 already displays when the SRD catalog is absent. Step 1 requires resolved entries, and changing class clears prior subclass and chosen class skills. The built-in definitions, including their existing racial bonuses, remain unchanged; this does not claim a rules-edition migration.

Local verification: 43 character tests cover all 12 classes through adapter/build/level-up and actual create-action normalization/rejection with a recording DB boundary. Six navigation/date tests and 23 offline Chromium scenarios pass, including complete SRD/fallback creation at desktop/mobile widths. The reported SRD sorcerer CON15 yields numeric 8/8; built-in human bonuses raise CON15 to16 and yield9/9. Types pass; lint has no errors and two existing Realtime warnings. Browser saves are explicit in-memory fixtures, not live authenticated acceptance. No schema, installed HP RPC, manual harness or saved-player-data mutation.
