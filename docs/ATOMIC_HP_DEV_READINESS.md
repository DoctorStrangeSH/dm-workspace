# Atomic HP DEV readiness

SQL prototype remains **unapplied**. DM authorization now requires both membership role `dm` and ownership of the campaign, matching #80. Additional token owner access remains explicit. Before executing in DEV: inspect all direct HP writers and confirm actual character HP shapes; verify SECURITY DEFINER role grants, cross-campaign tests and transactional rollback on disposable fixtures. Do not deploy this draft as a migration or apply to production.
