# PR #37 staging test matrix

This checklist is a release gate for Realtime authorization and private Storage. It is a test plan, not evidence that the tests have passed.

## Environment safety
- [ ] Use disposable local Supabase or an explicitly approved DEV test window with a fresh backup and rollback plan.
- [ ] Never apply these migrations to Production as part of PR #37.
- [ ] Confirm the tested commit SHA matches the PR head.
- [ ] Record migration output, test identities/roles (no secrets), and outcomes.

## Test identities
Create isolated fixtures in two campaigns, A and B:
- DM-A: DM in campaign A.
- Player-A: non-DM member in campaign A.
- DM-B: DM in campaign B.
- Outsider: authenticated but not a member of either campaign.
- Anonymous: no authenticated session.

## Storage matrix
Run each case for `handouts`, `music`, and `scene-maps`.
- [ ] Anonymous direct object URL read is denied after the bucket is private.
- [ ] Outsider cannot obtain a signed URL through the application route.
- [ ] Player-A cannot access a campaign-B asset, even if the object path/record ID is supplied.
- [ ] DM-A can access valid campaign-A assets.
- [ ] Player-A can access only visible handouts; hidden handout image returns 404.
- [ ] Player-A can access campaign-A tracks and scene maps only.
- [ ] Malformed object paths, foreign Supabase URLs, path traversal, wrong UUIDs/extensions, and mismatched record/object ownership are denied.
- [ ] Existing legacy public-URL database values are handled during migration without allowing foreign origins.
- [ ] DM-only upload/delete still works; players and outsiders cannot upload/delete.
- [ ] Audio playback supports browser Range requests after the signed redirect; expired signed URLs fail as expected.
- [ ] Scene-map and handout thumbnails load through authorized routes after the bucket is private.

## Realtime matrix
- [ ] DM-A and Player-A can receive member-safe topics for campaign A: `messages:A`, `music:A`, `walls:A`, `token-owners:A`, and scene-scoped `fog:sceneA`, `tokens:sceneA`.
- [ ] DM-B/Player-B cannot receive campaign-A topics, and A users cannot receive B topics.
- [ ] Outsider and Anonymous cannot receive private campaign/scene topics.
- [ ] `summons:A` is DM-only; Player-A, outsiders, and anonymous clients are denied.
- [ ] `handouts:A` remains DM-only for the legacy management stream. Players use `handouts-visible:A`; verify only the safe DTO is sent, hidden handouts are never broadcast, and hiding/deleting a visible handout emits a removal event. Confirm outsiders and anonymous clients are denied.
- [ ] Legacy `campaign:<id>` topic is denied; no client silently relies on it.
- [ ] Client-originated Broadcast writes are denied unless separately and narrowly authorized.
- [ ] Test INSERT, UPDATE, DELETE for every event source; token-owner trigger currently needs special attention because its live trigger behavior may not cover UPDATE.
- [ ] Confirm channel subscription uses private channels and exact topic names.

## Migration and regression checks
- [ ] Review all SQL against the live DEV schema before running it; the Supabase migration API showed no recorded baseline migration history, so do not assume a clean local reset reproduces the live schema.
- [ ] Verify policy names and role enum values against DEV.
- [ ] Verify Broadcast SECURITY DEFINER functions have a fixed safe search_path and qualified function references.
- [ ] Run the existing lint, typecheck, production build, and applicable Playwright smoke tests on the exact tested SHA.
- [ ] Confirm the three buckets are private and no broad public SELECT policy remains.
- [ ] Confirm Realtime no longer has a universally-true authenticated SELECT policy.
- [ ] Confirm application UI flows: handout create/visibility toggle, music upload/play/delete, scene-map upload/render/delete, VTT wall/fog/token state, summon requests, and chat.

## Release decision
Do not mark this checklist complete based only on static review or a green build. Attach observed results from a real test run. Keep PR #37 Draft/open until required cases pass and the handout Broadcast regression has an explicit resolution.
