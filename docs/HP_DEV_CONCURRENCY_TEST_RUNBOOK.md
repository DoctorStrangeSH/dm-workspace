# HP concurrency verification — disposable DEV only

**Status: executable test procedure, not a passed concurrency test.** DEV project: `yoondivyeueyrtgeldja`. Never run on production. Do not use the existing leveled-up warrior or any player-owned token.

## Prerequisites

- Create a **disposable** campaign, scene, character and linked token with matching character/token HP `20/20`, and two authenticated test accounts with deliberately configured membership/ownership.
- Confirm both test identities and exact authorization model independently. Do not use an administrative SQL session as a substitute for an authenticated user: `auth.uid()` and RLS behavior differ.
- Enable the currently installed `apply_token_hp_atomic` **only for the disposable DEV test**, through authenticated RPC calls. Do not turn on runtime flags globally.
- Record token HP, linked character HP and unrelated character JSON before and after each test. Ensure no concurrent legacy app HP writes.
- Ensure requests really overlap; use two independent client connections, not two sequential SQL statements. Enforce a timeout and preserve failures for review.

## Concurrent operations / assertions

| Case | Initial | Concurrent operations | Required end state |
|---|---|---|---|
| Damage/damage | 20/20 | damage(3), damage(4) | 13/20 in token and character |
| Damage/heal | 10/20 | damage(2), heal(5) | either 13/20 in both (both sequences lead to 13) |
| Stale set | 20/20 | set(16, expected=20), then set(12, expected=20) | one success, one SQLSTATE 40001; consistent 16/20 |
| Unauthorized | 20/20 | nonmember applies damage(1) | permission denied; no write |
| Cross-campaign | 20/20 | scene/token mismatch | error; no write |
| Malformed character | invalid fixture | damage(1) | error; no partial write |
| Multiple tokens (installed DEV RPC) | 20/20 each | damage through two linked tokens | **Known blocker:** installed RPC can leave a sibling token stale; record this without claiming success |
| Multiple tokens (review SQL after DEV installation) | 20/20 each | damage(3) through token A, damage(4) through token B | Character and BOTH tokens end at 13/20; no lost damage or partial writes |
| Character JSON edit | 20/20 | HP update + spell/inventory edit | no loss of non-HP fields; reject/retry stale writes |

## Technical execution guidance

Use the Supabase RPC HTTPS endpoint with two independently authenticated DEV users, each permitted for the exact disposable token. Send requests simultaneously (e.g., Promise.allSettled) and retain response status, SQLSTATE/message, request start/end times and final DB snapshots. Authenticated user tokens are secrets; never check them into Git.

RPC arguments:
`{ p_token_id, p_scene_id, p_amount, p_mode: 'damage'|'heal'|'set', p_expected_hp: null|number }`.

For damage/damage the existing installed RPC uses row locks to serialize **same-token** operations. For two tokens linked to one character, the currently installed DEV RPC does **not** include the sibling-token SQL draft from PR #164. Do not treat a sibling mismatch as a passed test. After a reviewed DEV-only installation, test that two concurrent requests through different tokens produce 13/20 everywhere.

### Unimplemented scenarios — do not falsely mark as passed

- Level-up concurrent with damage, and create-linked-token concurrent with level-up/damage, require runnable transaction RPCs that are **currently review-only and intentionally disabled**.
- Their proposed character→token lock ordering is not installed on DEV.
- Cross-writer coordination, character JSON CAS and server action feature flags must be resolved before rollout.

## Acceptance evidence

1. Fixture creation identifier inventory, confirmed DEV host, permission model and cleanup plan.
2. Before/after snapshots of all linked tokens and character HP for each test.
3. Parallel request log with error codes; at least 20 repetitions per concurrent case under an enforced timeout.
4. Clear pass/fail per scenario, including known unsupported multi-token case.
5. Full cleanup of disposable fixture, independently verified, without touching existing user campaigns.

**Stop/go:** Do not release atomic HP until the multi-token mismatch and cross-writer inconsistencies are fixed and two-user DEV evidence is recorded.
