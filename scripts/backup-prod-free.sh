#!/usr/bin/env bash
# Safe, read-only free-tier logical export of DM Workspace PROD user schema.
# Run locally with Docker + Supabase CLI. Does not export Auth/Storage managed schemas or Storage bytes.
set -euo pipefail
umask 077

EXPECTED_PROJECT_REF="klzziumdjpagqquihpks"
if [[ "${PROD_SUPABASE_PROJECT_REF:-}" != "$EXPECTED_PROJECT_REF" ]]; then
  echo "STOP: set PROD_SUPABASE_PROJECT_REF to the expected PROD project ref explicitly." >&2
  exit 1
fi
if [[ -z "${PROD_DB_URL:-}" ]]; then
  echo "STOP: provide PROD_DB_URL locally (never commit or paste it)." >&2
  exit 1
fi
command -v supabase >/dev/null || { echo "Supabase CLI required" >&2; exit 1; }
command -v docker >/dev/null || { echo "Docker required" >&2; exit 1; }
docker info >/dev/null 2>&1 || { echo "Docker daemon is not running" >&2; exit 1; }

OUT_BASE="${BACKUP_OUT_DIR:-$HOME/dm-workspace-private-backups}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="$OUT_BASE/prod-$STAMP"
mkdir -p "$OUT"
chmod 700 "$OUT"
trap 'echo "Backup export interrupted/incomplete; inspect private directory before use" >&2' ERR
echo "Exporting *only Supabase CLI-supported logical content* into private directory: $OUT"
supabase db dump --db-url "$PROD_DB_URL" -f "$OUT/roles.sql" --role-only
supabase db dump --db-url "$PROD_DB_URL" -f "$OUT/schema.sql"
supabase db dump --db-url "$PROD_DB_URL" -f "$OUT/data.sql" --use-copy --data-only -x "storage.buckets_vectors" -x "storage.vector_indexes"

for file in roles.sql schema.sql data.sql; do
  [[ -s "$OUT/$file" ]] || { echo "STOP: $file is empty" >&2; exit 1; }
done
if command -v sha256sum >/dev/null; then
  (cd "$OUT" && sha256sum roles.sql schema.sql data.sql > SHA256SUMS)
elif command -v shasum >/dev/null; then
  (cd "$OUT" && shasum -a 256 roles.sql schema.sql data.sql > SHA256SUMS)
else
  echo "Warning: no SHA-256 utility found; compute checksums manually" >&2
fi
cat > "$OUT/README.txt" <<'EOF'
INCOMPLETE BACKUP: THESE SQL FILES ARE NOT A FULL RESTORABLE SUPABASE PROJECT.
Supabase CLI omits managed Auth and Storage schemas and does not download Storage objects.
Separately export auth-related data via an approved secure recovery mechanism,
and download every Storage object (currently 1 object in bucket scene-maps).
Check ability to restore in a disposable LOCAL environment before approving PR #37 PROD migration.
Never add this directory to Git or send secret-bearing files through chat.
EOF
echo "Logical export complete, but FULL backup gate remains BLOCKED pending Auth/Storage and restore verification."
