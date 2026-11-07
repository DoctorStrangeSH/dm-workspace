# Production map layout regression

The turn timeline displayed full-width vertical cards in Production because the
Turbopack rule for `*.css` also matched `*.module.css`. Its `as: '*.css'`
output reclassified modules as global styles: their default import exported no
scoped class names. This affected both the timeline and map workspace modules.

The global Tailwind loader now excludes CSS Modules, leaving them to Next's native
CSS Module handling. Timeline, map geometry, initiative rules, server actions and
storage are unchanged.

## Verification

Run `npm run test:production-layout` after installing Playwright Chromium. This
builds and serves an isolated Next app with the real project configuration,
globals, timeline, map workspace CSS and synthetic initiative data. Tailwind scans
the real source directory. No test route is added to the deployed application;
no authentication, database or action transport is loaded. Browser requests to
external origins are blocked and treated as failures.

The test checks desktop/mobile horizontal 124px cards, expanded responsive grid,
collapse, focus/panel callbacks, scoped class exports, Tailwind utilities, map
height, workspace container/grid and page overflow. It runs in CI alongside the
existing esbuild UI suite, which does not exercise Turbopack's CSS import mapping.
Temporary build directories are removed in a finally block; screenshots and
measurements remain under ignored `test-results/`.

Before the fix, the actual Next build rendered the list with an empty class name,
`display: block`, 1396px cards and a 24px map viewport at 1440×1000. After the fix,
scoped names are present, the list uses flex, cards are 124px and the map viewport
is 620px. Re-running the new regression with unchanged main correctly fails at
`block !== flex`. Offline checks do not establish authenticated live acceptance.
