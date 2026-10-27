# PR #37 — Free-tier PROD backup gate (2026-10-27)

**STATUS: NOT BACKED UP / NOT CLEARED FOR PROD.** This is a read-only runbook, not backup evidence. Never commit database credentials, connection strings, SQL dumps, user data or Storage objects into GitHub.

## Verified read-only baseline

- Supabase PROD project: `klzziumdjpagqquihpks` (`dm-workspace-prod`), `ACTIVE_HEALTHY`.
- `pg_database_size(current_database())`: about **15 MB** (includes PostgreSQL storage overhead, not the actual dump size).
- `auth.users`: **4**; `public.campaigns`: **2**; `public.campaign_members`: **4**.
- `storage.buckets`: **4**; `storage.objects`: **1** total.
- The three PR #37 buckets (`handouts`, `music`, `scene-maps`) are **currently public in PROD**; Realtime has an unrestricted SELECT policy.
- PROD migration history has no PR #37 entries; all six migrations were applied to DEV. Keep PROD untouched until gate completion.
- DEV Preview for commit `ad3ec558fe3d940218a582d54861b33e3b6e360a` was READY. This does **not** imply that the production release is authorized.

## Zero-subscription backup procedure (operator's trusted local computer only)

1. Install Supabase CLI and Docker following official Supabase instructions. Obtain **PROD** session-pooler connection details from the PROD Dashboard > Connect and database password from the account owner. Keep them local, never share in ChatGPT, logs, GitHub, or shell history. Do not reset the database password merely to make a backup unless you understand its impact.
2. Work in a private local folder outside the Git repository. With a connection string passed securely in your local environment (`$PROD_DB_URL`), run the official Supabase logical exports:
   ```sh
   supabase db dump --db-url "$PROD_DB_URL" -f roles.sql --role-only
   supabase db dump --db-url "$PROD_DB_URL" -f schema.sql
   supabase db dump --db-url "$PROD_DB_URL" -f data.sql --use-copy --data-only -x "storage.buckets_vectors" -x "storage.vector_indexes"
   ```
   **Limitation:** Supabase CLI dump excludes Supabase-managed schemas (notably `auth` and `storage`). These files are NOT, by themselves, a complete restorable Supabase-project backup. Plan a separate, tested export/recovery approach for auth users and Storage metadata; avoid raw restoration into live Supabase without a documented procedure.
3. Separately export **every actual Storage file**, including the one currently in PROD, by downloading it from Dashboard > Storage (or using documented Supabase Storage CLI / S3-compatible export). Record bucket, object key, size and checksum; downloading only Storage metadata is insufficient.
4. Verify files are non-empty and SQL exports contain the expected user tables, schema and row data; compare row counts against the baseline. Store encrypted copies off-device. Validate restore in an isolated disposable local PostgreSQL/Supabase-compatible environment; do **not** restore into DEV or PROD as a test.
5. Record backup date, list of covered schemas/objects, object checksums and **actual recovery test** (no secrets or private records in PR). If user Auth, policy/trigger definitions, grants, Storage bytes or restore path are not covered, leave this gate **BLOCKED**.
6. Only after verified recovery, matched PR HEAD Preview, role-isolated DEV runtime checks and approved maintenance window, design a coordinated PROD application+six-migration rollout with fail-closed policies and rollback. No SQL or branch operations occur in this runbook.

Official docs:
- https://supabase.com/docs/guides/platform/backups
- https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore
- https://supabase.com/docs/guides/storage/management/download-objects

**Next AI:** Don't present this document as having performed a backup. Do not reapply the six DEV migrations, buy a plan, create paid branches, or expose public media while waiting for backup verification.
