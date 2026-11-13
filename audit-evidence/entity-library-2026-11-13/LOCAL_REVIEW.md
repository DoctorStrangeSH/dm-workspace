# Entity library review — 2026-11-13

Base: `1c9d3d72d5b30d22ee97ea8078cca062cdad0f13` (#281).
Feature: `feat/entity-library-workspace`. No direct main writes.

Verified locally: 222 offline browser scenarios +20 existing module tests PASS
(runner exit0), including four new actual-library scenarios. Four actual-page
module tests +four existing template-action tests PASS. TypeScript PASS; ESLint
0 errors with one pre-existing Realtime cleanup warning; changed code formatting
and diff checks PASS. RU desktop dark and EN320 player light captures inspected.
These tests use synthetic data/transports, with external browser requests blocked.

Review: membership gate precedes DB reads; server query projects card fields only,
adds player visibility, reads ordered pages despite row caps; only visible result
IDs enter the backlink props. Templates are requested for DMs only. Search/counts
exclude hidden player rows defensively. Create uses the unchanged server action,
with selected type passed as default. No hooks in branches, derived filter state
has no synchronization effects, native labelled inputs/selects and pressed buttons
retain keyboard operation, 44px filters fit320px. Existing dialog now uses two
type columns on narrow screens. Initial URL type links work; filter changes are
local. Paging is not transactional during concurrent edits (documented).

No schema, migration, RPC, HP workflow or Production data changes. W02/TD13 docs
now distinguish #281's verified schema restoration from unverified live saving.
Authenticated campaign acceptance is UNVERIFIED. Preview/PR CI, expected-head merge,
main CI and exact deployment/alias verification must precede a release claim.
