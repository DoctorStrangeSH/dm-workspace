# Public introduction and practice table

The exact `/` route introduces DM Workspace before registration. A guest can try a synthetic six-participant scene, advance initiative through rounds, select and move tokens, and sketch a straight-line route. The map artwork is local SVG; each cell represents five feet. The route is a visual distance aid, without wall, terrain or movement-speed adjudication.

## Boundaries

- The existing proxy verifies the user once. Guests may reach the exact root, existing login/signup paths and SRD license. Dashboard, campaign, API and join paths retain their existing gate. Verified members entering `/`, login or signup continue to `/dashboard`; refreshed session cookies survive that redirect, which is private and uncached.
- The root page contains no user data and performs no second auth lookup. The practice component imports no server actions, Supabase clients, storage or Realtime. All pieces, initiative values and names are invented demo data. Reset or reload discards the scene; nothing changes a real campaign or HP.
- RU/EN uses the existing `dm-lang` preference. A browser event notifies the shared language provider immediately, including client navigation into auth forms. The existing authenticated language control keeps its refresh behavior. Login/signup retain their existing form and `next` handling; their layout adds a home link.
- The grid has one tab stop, arrow/Home/End navigation and native Enter/Space activation. At small widths, the map scrolls internally with cells at least 56px wide; the initiative panel appears below it. All controls support touch. Copy and colors support both existing themes. The public introduction and registration link also render without JavaScript; demo interaction needs JavaScript.

## Verification

`npm run test:public-landing` executes the actual proxy with recording auth mocks and builds/starts an isolated Next production app using the real config, CSS, root page, language provider, proxy and auth pages. Only the fixture layout replaces downloaded fonts with explicit local fallbacks. Supabase configuration is a dummy `.invalid` endpoint, and external browser requests are blocked. No test route is added to the deployed app.

Coverage includes exact public/private route boundaries, verified-member redirects and refreshed cookies, RU/EN at 1440/390/320px, both themes, turn/round rollover, local moves without token overwrite, route distance/undo/clear, repeat route activation, reset, keyboard bounds/autoscroll, touch, one grid tab stop, no page overflow, no-JavaScript introduction, language persistence and immediate navigation into the real login form. Browser exceptions, external requests and mutating demo requests fail the test. Existing campaign UI tests remain in CI.

These isolated checks do not establish authenticated live campaign, HP or database-policy acceptance. The existing HP and concurrent combat restrictions remain unchanged.
