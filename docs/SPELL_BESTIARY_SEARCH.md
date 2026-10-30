# Spell and bestiary catalog search

Both catalogs now browse retained SRD rows in 24-entry pages with one lookahead
row, ordered by name then key. The initial page (including a failure result)
comes from the server; mounting does not repeat it. Previous/Next controls show
the visible row range and move focus/scroll to the named results region.

A read-only Production aggregate check on 2026-10-30 found 339 spells and
331 monsters. Spell schools use title case (for example Evocation), whereas
the UI uses lowercase keys. The paged spell action accepts both forms without
rewriting source data. Cantrip level zero and fractional monster CR are preserved.
The CR selector no longer hides options after its first 30 entries. A missing
singular cantrip label is supplied in RU/EN.

The clients share a controlled search controller and result states. Text input
stays editable with a 300ms debounce; filter changes and pagination run immediately.
Changing query or filters resets to page one. Functional partial updates preserve
both criteria when Reset clears two filter groups together. Revision tracking
and effect cleanup prevent late successes and failures from replacing current
results. Loading hides stale cards; empty results and failures are distinct.
Retry preserves current criteria and page. Search, pagination and filter controls
have accessible labels/states and 44/48px touch targets.

Paged actions validate offsets and sanitize query/filter inputs, returning an
explicit success/failure union. They use the request Supabase client; legacy
array-returning actions/caches remain available to other callers. Catalog reads
remain subject to existing database access policies. Campaign page access and
existing detail/add action paths are retained. No schema, import, player or HP
change is included, and browsing does not call the live Open5e API.

Verification runs the actual transpiled actions against recording query boundaries
for retained title-case schools, level zero, fractional CR, offsets past 100,
inclusive lookahead, stable order, invalid offsets, empty/last pages and failures.
Offline Chromium uses the real clients/search/results/cards/dialogs with synthetic
catalogs and controlled request outcomes. It covers late successes/failures,
pagination, retry, empty and initial errors, combined filter reset, RU/EN mobile
layouts, high CR availability and opening details without writes. These fixtures
do not establish authenticated live RLS or campaign write acceptance.

Checks: node --import tsx --test tests/spell-bestiary-search.test.ts;
npm run test:campaign-ui; typecheck; lint; CI build. Synthetic mobile screenshots
are saved as test-results/campaign-ui/mobile-{spells,bestiary}-{ru,en}.png.

Offset pages may move during concurrent catalog changes. Search/page state resets
on full reload; no bookmark/URL persistence is promised. Existing source-language
descriptions and write controls are outside this change.
