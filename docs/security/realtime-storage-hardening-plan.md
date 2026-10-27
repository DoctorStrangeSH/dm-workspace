# Realtime + Storage security rollout (DEV first)

Status: **design / audit only**. Do not change dashboard settings or merge until the app and SQL changes are complete and tested.

## Confirmed DEV findings (2026-10-25)

- `realtime.messages` SELECT policy `Authenticated can receive broadcasts` uses `true`. DEV has **Allow public access = ON**. Private-channel RLS must be scoped by `realtime.topic()`.
- Eight DB broadcast trigger functions emit row records. Topics: `fog:<scene_uuid>`, `tokens:<scene_uuid>`, `handouts:<campaign_uuid>`, `messages:<campaign_uuid>`, `music:<campaign_uuid>`, and `campaign:<campaign_uuid>` (walls/summons/token ownership).
- Browser hooks for fog/tokens/handouts/messages/music/walls specify `private: true`. Summons and token owners use public `summons:<campaign_uuid>` and `token-owners:<campaign_uuid>`, which do **not** match trigger topics. Chapters/initiative use `postgres_changes` instead of Broadcast.
- Storage bucket `handouts` is **public** and `storage.objects` has `Anyone can view handouts` SELECT. A user possessing the public object URL can retrieve the file independently of `public.handouts` RLS. The app uses `getPublicUrl()` for uploaded handouts. `is_visible=false` does **not** protect file bytes.
- Storage INSERT policies on `handouts`, `music`, `scene-maps` only check authenticated role, not campaign DM rights.

## Required implementation sequence

1. **Inventory payload confidentiality** for each broadcast table. In particular, `broadcast_handout_changes` sends a full row before any player visibility filter. Do not reuse a member-readable topic for DM-only payloads.
2. **Design topics by audience**. Campaign member topics for safe updates, explicit DM-only topics for unpublished handouts, and scene topics authorized by joining `public.scenes` to `public.campaign_members`. On shared topics transmit only player-safe fields and events; never send unpublished `image_url` or secret records. Review fog, tokens, walls, and summon metadata.
3. **Align senders/receivers**. The staged migration now routes walls to `walls:<campaign_id>`, summon requests to `summons:<campaign_id>`, and token owners to `token-owners:<campaign_id>`. Corresponding browser hooks use private channels and set Realtime auth before subscribing. Validate these changes in staging before applying the migration.
4. **Install narrow `realtime.messages` SELECT policies** for `extension='broadcast'`, `auth.uid()`, and exact topic authorization via `realtime.topic()`. Handle sender permissions separately; do not grant client INSERT unless a feature explicitly requires client Broadcast writes. Confirm trigger `realtime.broadcast_changes` continues to work.
5. **Migrate remaining browser Broadcast hooks to `private:true`**. After all subscribe and publish paths are verified, disable **Allow public access** in DEV, then rerun DM/member/outsider/anon WebSocket tests.
6. **Harden storage uploads**: replace the three broad authenticated INSERT policies with DM-only rules that enforce `storage.foldername(name)[1]` matches a campaign for which `public.is_campaign_dm` is true. Verify all upload flows, file sizes, types, deletion/overwrite paths. Public buckets do not protect secret media.
7. **Protect handout file bytes**: migrate handouts to private bucket access and short-lived signed URLs or authenticated download, preserving DM access and explicit player visibility. Update client/server rendering and existing stored public URLs. Audit and, if necessary, rotate/migrate previously published object paths. Do not flip bucket public flag before application support exists.
8. Stage rollout after DEV: validate functional/regression tests with DM, member, outsider, anon and remove the general broadcast SELECT policy only once scoped policies are functional.


## Topic and payload matrix (required before implementation)

The table below is a target contract, not a claim that the current DEV implementation already enforces it. Keep topic authorization and payload filtering as separate controls.

| Topic family | Intended audience | Authorization requirement | Payload contract |
|---|---|---|---|
| `handouts:<campaign_id>` | Campaign members | Authenticated member of that exact campaign; private channel | Player-safe lifecycle events only. Never broadcast hidden handout rows, hidden names, private `image_url`/storage paths, or unpublished metadata. Prefer an explicit safe DTO rather than `NEW`/`OLD`. |
| `handouts-dm:<campaign_id>` | Campaign DM only | Authenticated user is DM/owner of that exact campaign | Full handout management events allowed only if the UI needs them; never authorize by topic string alone. |
| `fog:<scene_id>`, `tokens:<scene_id>`, `walls:<scene_id>` | Members of the campaign owning the scene, with DM-only details separately scoped where needed | Resolve scene ID to campaign ID in DB and check current membership; DM-only mutations/data require DM role | Explicit allow-listed fields. Do not assume scene UUID secrecy is authorization. Check unrevealed fog and token ownership/hidden-state metadata. |
| `messages:<campaign_id>` | Members of that campaign | Authenticated member of exact campaign | Message fields only; verify sender identity and that any client-originated Broadcast is independently authorized. |
| `music:<campaign_id>` | Members of that campaign for playback state; DM for management/private metadata | Separate member-safe and DM-only operations if payloads differ | Playback-safe state only on member topic; no private URLs or management data unless intended for all members. |
| `campaign:<campaign_id>` | Avoid as a catch-all; split by resource/audience | Exact campaign membership and resource-level authorization | Do not multiplex summons, token ownership, and other full-row events without a per-event confidentiality review. |
| `summons:<campaign_id>` | DM for review; requester/member only where feature requires it | Must match sender topic and hook; verify member and DM rules | Minimum request DTO. Do not expose private requester/profile fields to unintended recipients. |
| `token-owners:<campaign_id>` | DM and only those members who need assignment visibility | Must match sender topic and hook; verify campaign membership | Token/user IDs only where required; avoid unrelated profile columns. |

### Current topic mismatch that must be resolved

The live trigger functions currently publish both summon requests and token ownership to `campaign:<campaign_id>`, while browser hooks subscribe to `summons:<campaign_id>` and `token-owners:<campaign_id>`. Choose one canonical topic per audience, update trigger and hook together, and add tests that fail if sender/receiver topic names drift. Do not merely rename the hook to the broad `campaign:` topic without checking every event published there.

### SQL authorization design constraints

- `realtime.messages` policies must be scoped to Broadcast messages and exact topics using `realtime.topic()`; authorization must resolve the topic's campaign/scene to database membership, not trust a client-provided campaign ID by itself.
- Use private channels consistently for every browser subscription and disable public access only after the private subscribe/publish flow has passed staging tests.
- Trigger functions should have a fixed safe `search_path` (and schema-qualified object references where practical). Review function ownership and trigger execution before revoking EXECUTE; do not blanket-revoke trigger functions without proving the trigger path still works.
- Prefer server-generated safe payloads/DTOs over broadcasting raw `NEW` and `OLD` rows. RLS on the source table does not automatically redact fields already emitted into a Broadcast payload.
- Verify both subscription authorization and publish authorization. A successful subscription test alone does not prove a client cannot spoof a Broadcast event.

## Test gates

- Outsider and anon cannot subscribe to any campaign/scene Broadcast topic; a member of campaign A cannot join campaign B or scene B.
- Player receives intended messages, visible handouts and scene events, but not unrevealed handout URLs or DM-only content; DM retains all needed updates.
- Client cannot spoof write Broadcast events without explicit authorization.
- Joining/removing campaign membership updates access on reconnect or token refresh (Realtime caches policies per connection).
- Direct public URL access to confidential handouts fails **after storage migration**; visible items are still viewable through intended authorized flow.
- Non-DM upload into another campaign's Storage prefix is denied.
- Do not merge/release unless all gates pass on staging.

## Implementation status (2026-10-27)

- The PR contains staged migrations that replace the broad Broadcast SELECT policy with exact membership checks and split the three legacy `campaign:<id>` publishers into resource-specific topics.
- The handout trigger now emits a minimal DTO to `handouts-visible:<campaign_id>` for visible handouts only; hiding or deleting a visible handout emits a removal event. The legacy `handouts:<campaign_id>` stream remains DM-only.
- The hooks for walls, summons and token owners use private channels. This has not been applied to DEV/production and has not yet passed real WebSocket integration tests.
- CI includes static PR #37 security checks and currently passes on the latest head. These checks do not execute SQL migrations or prove runtime RLS authorization. The legacy `campaign:<id>` topic remains intentionally denied until every sender/consumer is migrated and tested.

## Notes

The SQL needed for Realtime and Storage is intentionally **not included** in this first draft because applying broad permission changes before client channel and URL migrations would break existing behavior. Use separate reviewed migrations for the rollout. Main, DEV database and production are not altered by this plan.
