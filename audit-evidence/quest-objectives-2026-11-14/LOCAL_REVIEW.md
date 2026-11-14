# Quest objectives review — 2026-11-14

Base333f3110382b8f1175cdc6472ef571082eb85573, feature feat/quest-objectives.
Existing JSON storage only; no schema, live data, HP RPC or manual workflow mutation.
Quest detail offers up to20 objectives of200chars, stable IDs and explicit booleans.
Players read only; goals share quest visibility, described beside the input.
All-done does not change quest status. Existing notes/attributes remain in the JSON.
Malformed data is never silently reset; the shared attributes save refuses invalid
objectives rather than erasing them. No hidden subgoals or new Realtime subscription.

One existing serialized autosave handles both attributes and objectives. Every
data_json UPDATE requires the last acknowledged JSON snapshot. PostgreSQL JSONB
equality, entity ID and campaign ID form the UPDATE predicates; no matching row
is a conflict/access error. Server DM gate/RLS unchanged; runtime allowlist retained.
The real SDK transport test asserts exact URL encoding and stale/foreign rejection.
CI-only PostgreSQL temp fixture verifies JSONB equality and rolls back. This does
not add a database-wide version rule for other API clients. Very large old JSON
can exceed gateway URL limits and fail safely; no unguarded fallback is used.
Drafts stay on page after failure; touch retry and Ctrl/Cmd+S reuse acknowledged
snapshot, never the failed optimistic value. No automatic conflict merge.

Library fetches the objectives JSON path but projects only done/total counts;
texts/IDs never cross that server/client boundary. Search remains summary-only.
Current detail-page access/visibility gates and library player predicates remain.
Helpers reject duplicate IDs, bad types, empty/long text, extra fields and >20steps.

React review: derived bounded lists, stable keys, native labels/checks/buttons,
44px touch targets, pressed checkbox semantics, labelled rounded progressbars,
no new effects or request waterfalls; RU dark320/EN lightdesktop images inspected.
Initial local full browser run229/230 passed; only failure was a fixture URL using
&player instead of &role=player. Corrected targeted13/13 pass, including all4new
objective cases and journal checks. Final CI runs the full corrected suite.
17 module/action/page tests PASS, tsc PASS, lint0errors/onepreexistingRealtimewarning.
Final checks and release readbacks are recorded separately. Authenticated live
campaign acceptance remains UNVERIFIED; browser fixtures block external requests.
