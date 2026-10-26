# Atomic HP RPC integration switch

The application remains on its existing combat path by default. The previous `ATOMIC_TOKEN_HP_ALLOW_LOCAL` override is removed and must not be used. `ATOMIC_TOKEN_HP_RPC_ENABLED=true` opts into `public.apply_token_hp_atomic` only when the configured Supabase URL exactly matches the confirmed DEV project `https://yoondivyeueyrtgeldja.supabase.co` and `ATOMIC_TOKEN_HP_DEV_CONFIRMED=true`; Vercel production is explicitly refused. The environment switch **must not** be enabled until the RPC is deployed and validated in isolated DEV, and all competing character and token HP writers have been reviewed.

## Acceptance checklist
- Deploy reviewed function to DEV only using a reviewed migration, verify grants and authenticated/anon/cross-campaign behavior.
- Run concurrent damage/healing on disposable DEV fixtures and confirm token + character agreement.
- Verify stale 'set' requests fail safely, character non-HP data is preserved, and the user sees recoverable errors.
- Confirm deployment environment gating in your actual hosting setup; `NODE_ENV=production` is normal for preview builds, the gate instead checks the confirmed DEV Supabase project URL and an explicit DEV confirmation flag.
- Remove the old best-effort rollback path only when the RPC and every other HP writer use the same consistent approach.

No database SQL has been installed or executed by this PR.
