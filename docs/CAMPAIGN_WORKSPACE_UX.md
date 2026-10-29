# Campaign workspace UX and localization — 2026-10-29

## Behavior

Chat and the GM screen previously used the same floating bottom-right location. They now share labelled controls in the campaign header and one active-panel state. Opening either panel closes the other. Wide screens reserve 26rem alongside the content; smaller screens use a native modal dialog with keyboard focus containment, Escape, focus return and scroll locking. Dialog headers also contain the tool switcher. The existing GM keyboard shortcut and command-palette event remain available. Closed panels are absent from keyboard navigation; the chat remains mounted to preserve its draft across panel switches.

Chat has an expanding multiline composer, a 5000-character limit, pending/duplicate-submit protection, IME-safe Enter, Shift+Enter for new lines, and success-only clearing. Failed sends retain text and show a retry explanation. Dice controls are expandable with labelled inputs and larger targets. The message history scrolls within its own container: opening shows the latest message, incoming messages preserve history reading, and a jump button returns to the end. Delete controls work on touch and keyboard as well as hover.

The former “hidden roll” toggle did not pass its flag to either send handler. It has been removed rather than presenting public messages as private. This release does not implement whispers, private rolls or message access-policy changes.

Session mode uses the same chat composer/history and shared chat-open state. On compact screens Chapter/Map/Chat controls select one pane. Wide screens show chapter/map side by side with an optional chat column. Hiding chat actually hides the third grid child. The campaign's outer chat drawer and duplicate Realtime subscription are suppressed on session routes.

The shared primary button now uses an accent-foreground color appropriate to dark/light themes; ordinary buttons have clearer shape and larger default targets. The existing obsidian/gold visual direction is preserved. This is a workspace interaction pass, not a redesign of every editor and dialog.

## Navigation follow-up

The campaign header separates identity/search/appearance from Chat/GM and secondary tools. Language and theme controls share a labelled native disclosure with outside-click and Escape closure. Tool targets are at least 44px. Session-mode labels are translated in Russian.

Desktop navigation groups every existing route into table, world and reference sections, with role-filtered GM entries and an all-campaigns link. The sidebar uses a ResizeObserver-measured header height for its sticky offset and available scroll height, including when an adjacent workspace panel changes the header width.

Mobile quick navigation keeps four shortcuts and adds More. More and the header menu open the same native modal drawer, with complete grouped routes, focus cycling/return, Escape, backdrop closure, body scroll restoration and closure on the desktop breakpoint. Closed links are absent from the tab order. Active states match slash-delimited routes; nested pages activate their parent without matching similarly named sibling routes. Navigation shares the existing exclusive tool-panel state.

## Character names

Known classes, subclasses and species display in the selected language in creation, the confirmation step, character cards and the sheet/class selector. SRD IDs are preserved; missing or empty database translations fall back to the local known-name catalogue. Orc, Goliath and Aasimar cover SRD 2024 species absent from the legacy mechanical race list. Unknown entries retain their supplied display name/key and do not acquire invented rules. No reference-table or saved-character rewrite occurs.

## Verification and limits

`npm run test:campaign-ui` exercises real React components and Tailwind styles in isolated Chromium contexts with only in-memory message/Realtime and navigation boundaries. It checks desktop/mobile/light/player, send/retry/IME/multiline/duplicate submission, draft retention, history/new-message behavior, native dialog focus/resize/nested Escape, SRD labels, and session pane visibility. See tests/campaign-ui/README.md. CI installs Chromium and runs it. These checks do not establish authenticated server delivery, JWT/Realtime behavior or real-device virtual-keyboard behavior.

Before this pass, the released character suite passed 35 tests and the isolated PostgreSQL baseline passed all 42 tests including the parent. The latter still intentionally reproduces missing HP keys, stale siblings, direct-writer bypass, lock waits and token-creation races. They are not fixed by this UX change. No live HP RPC, mutating harness, migration, Supabase or player-data mutation was performed. Coordinated HP writers (B05), campaign-owner authority (B04) and migration provenance (B08) remain separate work before a database rollout.
