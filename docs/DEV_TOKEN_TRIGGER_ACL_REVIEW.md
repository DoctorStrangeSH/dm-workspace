# Token Realtime trigger privilege review — DEV

Read-only PostgreSQL `pg_get_functiondef` on confirmed `dm-workspace` DEV, 2026-10-26:
- `public.broadcast_token_changes()` and `public.broadcast_token_owners()` are PostgreSQL **trigger functions**, `SECURITY DEFINER`, no fixed search_path and call `realtime.broadcast_changes`.
- Supabase advisor flags them as anon-executable SECURITY DEFINER functions and mutable search_path.
- Because trigger functions return `trigger`, they cannot ordinarily be invoked as regular SQL/RPC functions: do **not** describe this as an independently demonstrated anonymous exploit.
- The functions' unqualified builtins and metadata variables should still be reviewed for search_path safety.
- `is_campaign_dm`, `user_campaign_ids`, `user_dm_campaign_ids` are SQL functions with `search_path=public`, use `auth.uid()`, and may be invoked as standard RPCs. Review separately; no blind changes in this PR.

## Proposed change, not executed
The companion `docs/sql/dev_token_broadcast_trigger_acl.REVIEW.sql` documents a narrow grant hardening option for the two token trigger functions. Before DEV application, verify whether trigger invocation by app user roles is affected and ensure Realtime broadcasts still work; revert grants if not. This proposal is **not** a deployed migration.

## HP RPC impact
The new atomic HP function updates `public.tokens`, so its update trigger must reliably broadcast to subscribed clients. Test trigger behavior during disposable-fixture damage/heal before calling the integration complete.
