# Entity template restoration — 2026-11-13

Base main096324ab402aca09b6e79ee06ce44ad82c2de0ef. Feature fix/entity-template-availability.
Read-only connector discovery matched Primary account Production klzziumdjpagqquihpks
dm-workspace-prod ACTIVE_HEALTHY. DEV inactive. Catalog confirmed templates absent,
campaigns.id UUID and current is_campaign_dm checks membership user_id/auth.uid +role dm.
Existing Vercel PGRST205 corroborated missing relation. Advisors inspected read-only;
pre-existing definer/search_path notices left unchanged and tracked separately.
Supabase docs API error-code page confirms PGRST205 missing URI table. Changelog fetch
timed out; docs search worked. No client-library/API version change in this patch.

CLI-generated additive migration creates the missing table with RLS, explicit grants,
scope/type/name/JSON constraints and campaign FK/index. No seed content; no existing
player/entity/HP row modifications. Uses existing authorization helper unchanged.
Tests run in disposable PostgreSQL CI and record actual action-module boundaries.
Production apply MUST wait for green exact-head SQL tests. Recheck absence before apply;
inspect unknown outcome before retry. Never invoke HP RPC/manual HP workflow.

UI source change only skips DM-only template query for players; server actions only
correct their existing successful-write revalidation path. No query error suppression,
fallback fake templates, new RPC, subscriptions or auth/grant changes on existing objects.
Final CI, migration apply/readback and release results recorded separately in root receipt.
No subagents; sources read-only. Authenticated live acceptance remains unverified.
