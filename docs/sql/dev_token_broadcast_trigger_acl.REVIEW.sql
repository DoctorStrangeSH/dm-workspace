-- REVIEW ONLY: proposed minimal trigger-function EXECUTE privilege hardening.
-- NOT DEPLOYED. Confirm function dependencies/ownership before applying to DEV.
-- PostgreSQL trigger functions cannot be invoked as ordinary SELECT RPC calls,
-- but PUBLIC/anon EXECUTE is unnecessary for direct callers in most trigger setups.
-- Validate trigger execution and Realtime broadcasts on disposable DEV tokens first.
BEGIN;
REVOKE EXECUTE ON FUNCTION public.broadcast_token_changes() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.broadcast_token_owners() FROM PUBLIC, anon;
-- Deliberately do not revoke authenticated/service_role or change function body.
COMMIT;
