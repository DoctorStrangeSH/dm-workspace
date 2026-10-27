# Transactional level-up HP synchronization — design review

**Status: design only. No RPC is installed or enabled.**

## Verified current behavior

- `applyLevelUp` currently sets character HP current/max to new max (full restore), and `levelUp` saves only the character's `data_json` through CAS.
- Linked scene tokens retain old `hp_current/hp_max`; the installed DEV `apply_token_hp_atomic` correctly refuses operations when character/token HP disagree.
- Existing token RPC acquires **token row lock first, then linked character row lock**. A naïve level-up transaction that locks character first and then tokens can deadlock against combat requests.
- One DEV example after level-up: character 47/47 and linked token 3/10. Another linked record has nonnumeric character HP (`D101`) and NULL token HP; it must not be coerced or automatically repaired.
- The HP RPC feature flag is disabled by default, and its environment guard prohibits production activation.

## Required consistency contract

1. Only the authenticated character owner or authorized campaign DM can level up; the RPC must re-check permissions inside SQL, not trust client-provided role or campaign.
2. Validate base class/level, ASI, rolled/average HP calculation, expected character snapshot, expected current HP, and expected level. Server-generated HP roll must not be client-controlled. Any changes must be from a validated server-side transition, not arbitrary JSON input.
3. In **one DB transaction**, save next-level character fields and update **all** linked tokens in the same campaign. Either all succeed or all roll back. Reject cross-campaign character links.
4. Preserve other token data and unrelated character JSON fields; no partial updates if token HP is invalid, if the linked scene is inconsistent, or if the character changed after the initiating read.
5. Current application policy: level-up **fully restores character HP**. If retaining that rule, set each linked token's current and max to the resulting character current/max, but only after each token's pre-state passes validation. If desired game rules change to preserve damage, change `applyLevelUp` and add explicit regression tests **before** implementation.
6. Existing mismatches cannot be silently reconciled; require explicit DM-approved repair after inspecting source-of-truth values.

## Lock ordering (blocker)

The existing HP RPC locks **token → character**, so a separate routine locking **character → all tokens** creates a deadlock cycle. Sorting tokens alone does not resolve interactions with independently locked RPC requests.

**Choose and test one shared locking protocol before implementing.** Recommended:
- Refactor the installed token HP RPC and server-side HP writers to acquire **character → token** for linked-token operations, and sort all multi-token locks by token UUID. Unlinked tokens may lock their own row.
- Fetch character ID without lock, then lock character, then token; re-read and verify the token↔character relationship and campaign under lock. Retry controlled serialization failures, never silently apply stale values.
- Account for other writers (`updateCharacterHP`, `longRest`, death saves, character JSON CAS, token creation/removal, combat CAS): every writer must participate in the same protocol or be blocked during rollout.
- Do not promote the new RPC while older writers can bypass locking or still perform nontransactional dual writes.

## DEV acceptance tests (separate disposable fixture)

| Case | Expected result |
|---|---|
| Level up 3/10 HP, one matching token | Character and token reflect same new max/current, no partial save |
| Level up one character with two tokens | Both tokens + character updated atomically |
| Concurrent damage and level-up | Serializable end state or explicit retry; never divergent HP |
| Concurrent damage through two tokens of one character | No lost damage or deadlock |
| Stale expected character JSON/level | Entire transaction rejected |
| Mismatched prior token HP | Entire transaction rejected, no repair by accident |
| Nonnumeric `D101` or NULL HP | Explicit error, no mutation |
| Foreign-campaign token or unauthorized player | Denied |
| Character edit/spell update concurrent with level-up | Other fields preserved, stale update rejected |
| Two simultaneous level-ups | At most one succeeds for a given expected level |
| Long rest, death save natural 20, token deletion concurrent | Consistent end state, no deadlock |

## Rollout gates

1. Write reviewed SQL design and matching unit tests; ensure lock ordering agreement.
2. Set up disposable DEV campaign/character/multiple tokens and two test users.
3. Install **DEV only** after SQL permissions/security review; verify explicit EXECUTE grants and no anon access. Keep production and feature flags unchanged.
4. Exercise actual parallel requests with timeouts, capture before/after snapshots and retry behavior; verify rollback and RLS.
5. Run CI, full game/UI smoke checks, staging validation, then separately authorize production migration.

**Do not run migration or change any existing character/token HP as part of this document.**
