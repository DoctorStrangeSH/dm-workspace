# Scene token preparation

Adding a token opens a preparation workspace instead of immediately writing a token.
Search characters or campaign monsters, select one, inspect HP, and edit its map name,
border color, size (1–4 cells) and placement preference. Custom tokens can have optional
positive integer HP. Only **Add to scene** calls the existing token creation action.
Cancel, search and preview do not write. PNG art remains available from the token's
appearance panel after creation.

Placement finds the nearest free cell footprint to the center or upper-left corner
using the current live token snapshot. It checks map bounds and fractional existing
footprints. It does not reserve cells across clients or check fog, walls or movement
rules. Another participant can move into that space before the write completes.
If no position fits, adding is disabled; reduce the size or free some space.

Character HP uses the existing strict reader, preserving current zero. Monster HP
accepts positive integer HP, an explicit stat-block average, or a dice expression:
`2d8+4` becomes 13 rather than 2. Malformed or unknown HP creates no HP bar and shows
a warning. Source characters and entities are never rewritten by this preparation.

Pending creation locks the draft and close controls and blocks duplicate clicks.
Returned errors retain the draft for retry. A lost/thrown response disables repeat
creation and asks the user to check the scene first because the write may have succeeded.

The native modal supports keyboard focus, Escape and fullscreen map hosting. Narrow
screens use a vertical layout. Offline browser tests cover Russian/English and desktop/
320px layouts, source HP, explicit confirmation, cancellation, errors, pending and
uncertain results, fullscreen and live placement updates. Unit tests cover HP parsing
and footprint geometry. Real Next production CSS tests verify modal viewport bounds,
scrolling and focus restoration. Live authenticated acceptance is a separate check.

No database migration, HP RPC, movement, combat or Production data repair is required.
