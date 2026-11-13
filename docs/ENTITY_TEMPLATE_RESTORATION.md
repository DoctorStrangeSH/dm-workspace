# Entity template storage restoration

Production `dm-workspace-prod` / `klzziumdjpagqquihpks` was verified read-only:
`to_regclass('public.entity_templates')` returned null, while entities and campaigns
exist. The existing template query produced PGRST205; this was schema drift rather
than a missing UI feature. DEV is inactive and was not resumed or changed.

Migration `20261113125548_entity_templates.sql` was generated with Supabase CLI.
It adds only the absent table, constraints, index, privileges and three RLS policies.
It fails if the table already exists, so an unexpected schema is not silently accepted.
No existing entity or campaign row is rewritten; no builtins or sample content are seeded.

The application already saves entity description/data snapshots and consumes them in
the creation dialog. New custom templates belong to one campaign; only that campaign's
DMs may read, insert or delete them. This uses the existing `is_campaign_dm` helper,
whose installed definition was inspected and matches campaign membership semantics.
Builtin rows may be read by signed-in users, but client roles cannot create/delete
them. No client UPDATE grant exists; anonymous access is revoked. Players do not
request this DM-only library on the entity list page. Existing action access gates
and campaign/source predicates remain. Successful writes now revalidate `/entities`,
the actual consuming page, rather than the nonexistent `/templates` path.

The isolated PostgreSQL CI fixture exercises the exact migration under DM A, DM B,
player, outsider and anon, including cross-campaign insert/delete, forged builtins,
UPDATE denial, invalid JSON/type and campaign-local cascade. Its outer transaction
rolls back every test-only object/row. It never connects to Supabase. Action tests
execute the actual action module against a recording transport, checking unauthorized
callers, source scoping, normalized snapshots and builtin deletion predicates.

Release sequence: green exact-head CI and review, verify Production identity/table
absence/helper again, apply only this additive migration, read back schema/RLS/grants
and migration record, merge with expected head, verify main CI and exact Production.
If migration outcome is unknown, inspect the catalog/history before any retry. Do not
drop the table as a rollback once users may have saved templates; keep the compatible
additive schema and roll back application code if needed. Never invoke the installed
HP RPC or manual HP workflow. No existing security advisories are fixed implicitly.

Read-only Production advisors still report pre-existing mutable search paths and
publicly callable definer functions; tracked security work remains separate. See
[Supabase advisor guidance](https://supabase.com/docs/guides/database/database-linter).
Authenticated live campaign acceptance remains unverified without a signed-in browser.
