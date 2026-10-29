# Offline campaign UI acceptance

Run `npx playwright install chromium`, then `npm run test:campaign-ui` from the repository root.

The runner bundles the actual campaign tools, native workspace panels, chat input/list/dice, GM screen, session layout and character identity selector with React and the real Tailwind styles. Only Next navigation, message transport and the Realtime hook are replaced with an explicit in-memory boundary. A new loopback HTTP server and isolated Chromium contexts are owned and closed by the runner; browser requests to other origins are blocked. No environment files, JWTs, Supabase, remote database or player rows are used. Generated screenshots are in ignored `test-results/campaign-ui/`.

Acceptance covers panel switching and focus, desktop content reservation, mobile modal/keyboard/resize behavior, nested confirmation Escape, draft preservation across panel switches, send failure/retry, duplicate submission, IME/multiline input, scroll preservation/new messages, English/Russian SRD labels and the mobile session's single visible pane. This proves component interaction, not authenticated server-action authorization, live message delivery or Realtime acceptance. Existing HP regressions and the isolated PostgreSQL defect baseline remain separate checks.
