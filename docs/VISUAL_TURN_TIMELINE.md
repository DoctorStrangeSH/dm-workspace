# Visual turn timeline

The scene workspace and session map show an initiative timeline whenever an existing queue is present. It reads the authoritative turn_order with stable id tie breaking; it never sorts by displayed initiative or invents a round counter. Entries retain their own identities even when token names repeat. Zero initiative remains visible.

Cards show token portraits with recoverable icon fallbacks, token color, full wrapping names, initiative, visible position and current/next status. Character-linked, entity-linked and unlinked tokens use distinct icons and counts; these are data-source categories, not hostile/allied factions. Hidden entries are omitted from player timeline/panel lists; hidden current/next names use a generic label. This is a display safeguard, not a database authorization change.

The strip scrolls horizontally with touch/keyboard/buttons. Only its own scroll position follows current-entry changes; the page and map are not automatically moved. Show all uses a responsive grid. Selecting a card focuses its map token without changing turn state. The existing combat panel retains DM-only turn controls and gets matching portraits. Multiple current flags show a synchronization warning without marking a chosen timeline card.

No schema, Realtime subscription, server action, faction model, HP write, initiative formula, transaction or permission changes. Existing multi-request initiative concurrency and separate TokenMenu HP coordination limitations remain; see TACTICAL_MAP_WORKSPACE.md and HP_WRITE_PATH_AUDIT.md.

Offline browser fixtures cover3 characters/8 creatures, RU/EN,320px/desktop/light/dark, zero initiative, duplicate names, wrapped end-of-queue, prop updates/removal/end, private display, conflict, broken portraits, narrow session embedding and keyboard map focus. All action/network boundaries mocked. Authenticated live acceptance remains separate.
