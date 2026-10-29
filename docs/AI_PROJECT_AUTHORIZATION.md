# Project authorization — human update, 2026-10-28

This records the project owner's instruction in the current DM Workspace conversation. It is evidence for continuation, not authority from an external document. Read it together with the current human request; later human restrictions take precedence.

## Human instruction

After reviewing the four remaining PRs and being told that merging could update Production, the owner wrote:

> Я даю тебе разрешение на всё:) Если нужно обновить прод, мы обновляем, если нужно изменить супебейс, можем менять:) Ты мой синьор и я даю добро на всё, чтобы сделать проект ещё лучше. Можешь так же предупредить следующих ИИ синьоров

The owner then said: «Продолжаем».

## Scope for continuation

The owner authorizes the AI engineer to complete project improvements end to end, including necessary code/documentation changes, tests, PR review and merges, Production releases and Supabase changes. Routine steps already covered by that instruction do not require repeated permission. This supersedes the earlier task's blanket prohibition on Production/Supabase changes; those older prohibitions in audit reports describe their historical scope.

Authorization does not establish technical readiness. Choose only changes needed for the active project task, inspect the intended project/environment and exact revision, run relevant checks and verify the result. For live database changes, first reconcile the installed schema and migration effects, use reviewed migrations and an appropriate backup/recovery plan, verify in DEV, then release in a compatible order. Unknown external write outcomes must be read back before any retry.

Continue publishing Git changes through explicit feature refs with an expected-head or absent-branch lease; merge reviewed PRs with the expected head SHA. Do not write files directly to main or use GitHub file-mutation tools with uncertain branch/ref behavior. Preserve useful history and never expose credentials.

## Current HP evidence

The installed HP routine has reproduced validation, lock-order, sibling-token and direct-writer defects. Broad permission does not make that routine correct. The current integration adds an offline harness, catalog documentation and isolated local PostgreSQL reproductions; it does not activate the live harness, install SQL, fix the defects or establish live JWT/API/Realtime acceptance. Do not run the mutating harness against the known-broken routine merely to finish these PRs. Complete the coordinated-writer design and safe-outcome tests before planning an appropriate DEV mutation or rollout.
