# Item catalog search and browsing

The catalog page now uses `searchSrdItemsPageAction` with 24 items per page and
one lookahead row. A stable `name, key` order keeps identically named source
records distinct. Search/type/rarity criteria are sanitized on the server, and
offsets are validated. The older array-returning action is retained for existing
callers. No live Open5e request is made during browsing.

The initial page is rendered on the server, including an explicit failure result;
mounting does not duplicate that query. Query/filter changes reset to page one.
Text entry is debounced 300ms and stays enabled. Each request has a revision;
cleanup prevents old successes or failures from replacing the current result.
During debounce/loading, old matches and page controls are hidden so they cannot
be mistaken for results of the new criteria. Transport/database failures are
distinct from an empty successful result, and Retry keeps the criteria/page.

Previous/Next controls show page and visible row range without claiming a total
count. Page navigation moves focus/scroll to results. Filter controls expose
pressed/expanded states and provide mobile touch targets. New status/error/page
labels support RU/EN. Catalog changes made concurrently can move offset pages;
this is not a persistent database snapshot. Navigation state currently lives in
the page and resets on a full reload; no saved URL/bookmark contract is added.

The owner confirmed Open5e as the original data source and supplied
https://open5e.com/api-docs. The exact page was read on 2026-10-30: it describes
V2 as current, V1 as deprecated, endpoint search/filtering and ordering. This
change continues to use the site's retained catalog, with its source attribution;
it does not expand the source set, import third-party books, change translations,
rerun seeds or alter player data. See `MAGIC_ITEM_CATALOG_IMPORT.md` for the prior
760-record import and license checks.

Verification executes the real action with recording query boundaries for
inclusive ranges/lookahead, ordering, criteria and failure distinction. Offline
Chromium exercises the real ItemsClient/Search components with controlled late
successes/failures, pagination, retry, empty results, initial failure and 390px
RU/EN filters. Write boundaries are mocked and recorded; browsing makes no
character actions. These fixtures do not establish authenticated live RLS or
player write acceptance. No DB/schema/HP change is included.

Checks: `node --import tsx --test tests/item-catalog-filters.test.ts`,
`npm run test:campaign-ui`, typecheck, lint and CI build. Synthetic browser images
are saved under `test-results/campaign-ui/mobile-catalog-{ru,en}.png`.
