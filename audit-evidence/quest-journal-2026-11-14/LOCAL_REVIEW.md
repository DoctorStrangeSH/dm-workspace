# Quest journal review — 2026-11-14

Base `707741dc8ccb2c43c966c51234d2b7c676c2b959`; feature `feat/quest-journal`.
Read-only journal over existing entity status/giver/location/reward fields. No
schema, RPC, HP workflow or Production data writes. Status edits remain in the
existing entity detail form. Unknown/missing/malformed states are explicitly
unset and are never counted active. Cards link to the existing entity route.

Server query uses documented PostgREST JSON-path aliases for four fields; explicit
projection excludes full JSON, notes, unexpected data and nonquest summaries.
Strings are bounded500 and objects/arrays/numbers ignored. Existing membership,
RLS, player visibility predicates, DM-only templates and backlink-ID projection
remain. Offset read consistency limits are unchanged. Player hidden rows never
enter UI search or counts. No new subscription or write action is introduced.

React review: derived filters have no effects; stable keys, native buttons with
pressed state and labels, keyboard activation, 44px or larger touch controls;
two-column status layout on320px. RU dark/EN light desktop and320 screenshots
inspected; mobile capture can show an internally scrolled section under the
existing sticky navigation, with all content reachable by scrolling. Creation
still respects the selected type and existing DM permission checks.

Full local run99195 EXIT0:226browser+20module PASS.12 page/template/summary tests PASS;
TypeScript PASS; full ESLint0errors with one
pre-existing Realtime cleanup warning; changed code formatting/diff PASS. Four
new browser cases PASS and existing library cases PASS. Full browser run result
and remote CI/release readbacks are recorded separately in the release receipt.
Browser cases use synthetic data with remote requests blocked. Authenticated
Production campaign acceptance remains UNVERIFIED. See docs/QUEST_JOURNAL.md.
