# Atomic HP RPC integration switch

The application remains on its existing combat path by default. `ATOMIC_TOKEN_HP_RPC_ENABLED=true` opts into `public.apply_token_hp_atomic` only outside production environments; production is explicitly refused. The environment switch **must not** be enabled until the RPC is deployed and validated in isolated DEV, and all competing character and token HP writers have been reviewed.

## Acceptance checklist
- Deploy reviewed function to DEV only using a reviewed migration, verify grants and authenticated/anon/cross-campaign behavior.
- Run concurrent damage/healing on disposable DEV fixtures and confirm token + character agreement.
- Verify stale 'set' requests fail safely, character non-HP data is preserved, and the user sees recoverable errors.
- Confirm deployment environment gating in your actual hosting setup; `NODE_ENV=production` is normal for preview builds, so do not set the override in any production deployment.
- Remove the old best-effort rollback path only when the RPC and every other HP writer use the same consistent approach.

No database SQL has been installed or executed by this PR.
