# Multi-token HP DEV acceptance gate

Status: BLOCKED. This document is a plan, not a deployment authorization.

## Current writer audit

The current server actions have multiple HP mutation paths. Before enabling the atomic RPC, all must use one compatible transaction/locking protocol or be explicitly rejected for linked characters:

- `createToken`: inserts caller/normalized `hp_current` and `hp_max` directly.
- `updateTokenHP`: delegates absolute HP setting through `damageToken`.
- `damageToken`: optional DEV-only RPC path; legacy path remains.
- `updateCharacterHP`: edits character HP through whole-document save.
- `rollDeathSave`: natural 20 changes character HP.
- `longRest`: restores character HP while also changing resources.
- `levelUp`: full-heal and level change in one character document.
- `updateCharacter`: accepts `data_json`, so callers may submit HP as part of a whole-document update.
- `saveCharacterData`: whole-document JSON CAS used by other character actions.

## Disposable DEV fixture acceptance

Use only a dedicated disposable campaign, character, and two tokens in different scenes. Never use Production or a real player's character.

1. Character and both tokens begin at 20/20.
2. Damage token A by 3: character, A, and B all become 17/20.
3. Damage token B by 4: all three become 13/20.
4. Concurrent damage (-3, -4): serialized response states are {17,13}; final state is 13/20 everywhere.
5. Start with one deliberately mismatched sibling token: mutation fails closed and leaves all rows unchanged.
6. Force an error during the transaction: all writes roll back.
7. Create a new linked token while character is at 13/20: it starts at 13/20 from canonical character state.
8. Verify cross-campaign, non-member, and unauthorized-player writes fail.

## Release gate

- SQL implementation reviewed against deployed DEV schema, RLS, grants, and all lock ordering.
- Every writer above is coordinated or blocked for linked characters.
- SQL integration tests run against a disposable DEV database.
- No review-only function is installed as-is; current SQL drafts intentionally raise a REVIEW ONLY exception.
- Do not enable `ATOMIC_TOKEN_HP_RPC_ENABLED` or deploy to Production until all acceptance checks pass.
