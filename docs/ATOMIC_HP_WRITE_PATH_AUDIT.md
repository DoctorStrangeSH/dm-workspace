# Atomic HP rollout: permission helper and write-path audit

Date: 2026-10-26. **Read-only** inspection of connected `dm-workspace` DEV and repository branch from PR #76. `dm-workspace-prod` was not queried.

## Actual helper implementations (read-only pg_get_functiondef)
- `public.is_campaign_dm(campaign_id)` is `STABLE SECURITY DEFINER` and checks `public.campaigns.owner_id = auth.uid()`, **not** `campaign_members.role = 'dm'`.
- `public.user_dm_campaign_ids()` also returns campaigns owned by `auth.uid()` — not every row with a member role of `dm`.
- `public.user_campaign_ids()` returns member campaign IDs. All three helpers explicitly reference `auth.uid()`, have `search_path = public`, and previously inspected function grants include anon/PUBLIC execution. These grants alone do not demonstrate a vulnerability.

**Important discrepancy:** application `getCampaignAccess` treats `campaign_members.role='dm'` as DM, while database helpers use `campaigns.owner_id`. The draft atomic function currently accepts member role `dm`; its permission semantics could therefore differ from existing RLS and other code. Decide and document a single authoritative DM rule before promoting the RPC.

## Concurrent HP writers identified
1. `src/lib/actions/combat.ts` `damageToken`: updates `tokens.hp_current`; then reads and replaces the entire `characters.data_json` for linked character, with best-effort compensating token rollback. Cross-table updates are **not transactional**.
2. `src/lib/actions/tokens.ts` `updateTokenHP`: updates `tokens.hp_current` directly, without linked character synchronization.
3. `src/lib/actions/characters.ts`: `saveCharacterData` writes **entire** `characters.data_json`. `updateCharacter` also allows full `data_json` replacement. These writes can overwrite HP (or other fields) concurrently even if the atomic HP RPC is implemented.

## Blocking integration requirements
- Decide what should happen when a linked token and character currently have different HP; draft SQL fails closed.
- Use one atomic, authorized write path for delta HP and absolute HP writes. Absolute setting must pass expected current HP or a version.
- Protect character editors' full `data_json` writes against racing HP changes. Options: versioned compare-and-set for character document, server-side patching of disjoint paths, or a transaction that locks the same rows; include all callers.
- Align DM ownership semantics at app layer, RLS, and RPC. The prototype's `SECURITY DEFINER` must be threat-modelled before exposure.
- Audit additional frontend/direct Supabase write paths and RPC grants before rollout. The paths above are verified, not an exhaustive codebase-wide grep.
- Verify the final function on disposable DEV fixtures with concurrent requests and adversarial role checks. No DEV/prod writes performed during this audit.

## Next recommended PR
Implement character JSONB patch/version guards and server-side atomic HP RPC integration **together** only after reviewed and tested on isolated DEV. Do not merge a deployed RPC alongside unrestricted legacy HP writers.
