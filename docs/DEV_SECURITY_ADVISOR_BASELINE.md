# Actual DEV security advisor baseline — 2026-10-26

Project: **dm-workspace DEV only**. This audit was performed read-only. **Production was not queried or changed.**

## Observed
- `public.apply_token_hp_atomic` is absent (0 installed functions in DEV).
- Supabase security advisor identifies **15** anonymously executable `SECURITY DEFINER` functions, including token broadcast, campaign membership and account creation helpers. The functions need individual examination before any grants are changed. The count is an advisor finding, not proof of exploitation.
- Advisor identifies **13** functions with mutable/unset search paths. These are existing unrelated functions; avoid broad automated edits.
- Advisor identifies an RLS-enabled backup table without policies. No data from it was read.

## Implications
- Do not deploy a new privileged public RPC without verifying exact role grants, `auth.uid()` checks, and cross-campaign access.
- Existing function grants should be audited in a separate security PR; don't revoke blind, as functions may be needed by triggers or RLS.
- The new SQL draft already restricts `anon` and `PUBLIC` EXECUTE but still needs end-to-end authenticated adversarial tests. Production deployment remains a separate reviewed decision.
- Validate prerequisites with `docs/sql/atomic_hp_dev_security_assertions.sql` (read-only); create disposable fixtures before any write-based concurrency testing.

## Relevant Supabase advisories
- [Anonymous SECURITY DEFINER executions](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable)
- [Mutable search paths](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable)
- [RLS enabled without policies](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)
