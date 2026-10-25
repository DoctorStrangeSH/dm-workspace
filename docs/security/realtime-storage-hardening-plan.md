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
3. **Align senders/receivers**. Existing triggers publish summons and token owners to `campaign:<id>`, but hooks listen elsewhere. Choose a consistent private topic and test events.
4. **Install narrow `realtime.messages` SELECT policies** for `extension='broadcast'`, `auth.uid()`, and exact topic authorization via `realtime.topic()`. Handle sender permissions separately; do not grant client INSERT unless a feature explicitly requires client Broadcast writes. Confirm trigger `realtime.broadcast_changes` continues to work.
5. **Migrate remaining browser Broadcast hooks to `private:true`**. After all subscribe and publish paths are verified, disable **Allow public access** in DEV, then rerun DM/member/outsider/anon WebSocket tests.
6. **Harden storage uploads**: replace the three broad authenticated INSERT policies with DM-only rules that enforce `storage.foldername(name)[1]` matches a campaign for which `public.is_campaign_dm` is true. Verify all upload flows, file sizes, types, deletion/overwrite paths. Public buckets do not protect secret media.
7. **Protect handout file bytes**: migrate handouts to private bucket access and short-lived signed URLs or authenticated download, preserving DM access and explicit player visibility. Update client/server rendering and existing stored public URLs. Audit and, if necessary, rotate/migrate previously published object paths. Do not flip bucket public flag before application support exists.
8. Stage rollout after DEV: validate functional/regression tests with DM, member, outsider, anon and remove the general broadcast SELECT policy only once scoped policies are functional.

## Test gates

- Outsider and anon cannot subscribe to any campaign/scene Broadcast topic; a member of campaign A cannot join campaign B or scene B.
- Player receives intended messages, visible handouts and scene events, but not unrevealed handout URLs or DM-only content; DM retains all needed updates.
- Client cannot spoof write Broadcast events without explicit authorization.
- Joining/removing campaign membership updates access on reconnect or token refresh (Realtime caches policies per connection).
- Direct public URL access to confidential handouts fails **after storage migration**; visible items are still viewable through intended authorized flow.
- Non-DM upload into another campaign's Storage prefix is denied.
- Do not merge/release unless all gates pass on staging.

## Notes

The SQL needed for Realtime and Storage is intentionally **not included** in this first draft because applying broad permission changes before client channel and URL migrations would break existing behavior. Use separate reviewed migrations for the rollout. Main, DEV database and production are not altered by this plan.
