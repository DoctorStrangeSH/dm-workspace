# Compact combat workspace — 2026-11-13

Base main448e91318ab94545203cf8264dd8dade2ee3ce97; feature feat/compact-combat-workspace.
Never push directly to main. Presentation changes only: local card-density toggle,
current-card centering on density change, fixed panel controls, one content scroller,
short participant roll label with unchanged full accessible name and confirmation.

Six final focused browser scenarios PASS: RU/EN desktop dark/mobile320 light, density
height/order, keyboard toggle, expanded layout, stable panel commands during content
scroll, keyboard focus visibility and focus return, hidden participant in both densities,
PageDown in a390px-high viewport with commands still reachable.
RU mobile light timeline/panel and EN desktop dark inspected; no horizontal page overflow.
React review: local UI state, no new effects except existing centering dependency,
no new transport/listeners/subscriptions/actions. Existing pending/error/confirmation
boundaries remain. Full regression and final CI results recorded in release receipt.

One initial new privacy scenario used unsupported fixture flags; corrected to existing
hideEnemy/role=player/turn=3. Product privacy behavior was unchanged.
Initial CI43423698582 passed218browser+20module but the real Next production layout test
still expected legacy124px/flex cards. Updated it to validate compact184px/grid and
detailed124px/flex, both expanded layouts and actual compact height savings.
No DB/schema/HP/RPC/manual workflow mutations. Sources read-only, no subagents.
Authenticated live campaign acceptance remains unverified; synthetic transport is not
evidence of live authorized saves. Existing entity_templates drift tracked W-02/TD-13;
existing multi-client combat and HP coordination remain unresolved.
