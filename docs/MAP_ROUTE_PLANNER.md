# Map route planner

Route is a personal planning tool on scene and session maps, available to DMs and
players. Click/tap cell centers to mark a path with turns. The panel shows total
distance, cells and segment count; a compact total stays inside the scrollable
map while planning. Undo removes the last point; Clear starts again. Switching
tools or closing the planner discards the draft. Scene/grid geometry changes
invalidate it. No route is persisted, broadcast or submitted to an action.

Straight-line measurement sums Euclidean segment lengths at five feet per cell.
On square grids, an explicit alternative counts each diagonal as five feet
(Chebyshev distance per segment). The total rounds once after summing all legs.
The tool does not check walls, difficult terrain, speed or movement legality;
it never moves tokens or consumes movement. Gridless scenes use straight-line
measurement only, consistent with the existing five-foot logical map scale.

Cursor on map places a keyboard cursor in the visible map area. Arrow keys move
one cell, Enter/Space adds a point, Backspace undoes, Home centers the cursor on
the board, Escape exits and restores trigger focus. Keyboard movement scrolls
the map as needed. Pointer capture adds a point only on release; cancellation
preserves the committed route. Coordinates use transformed layer bounds so zoom
and scrolling do not alter distance. Consecutive duplicates are ignored and a
50-point cap bounds rendering. No global keyboard listeners are added; nested
dialogs keep their existing Escape behavior. Controls have RU/EN labels and
44px touch targets.

Verification: four geometry/point tests plus seven offline browser scenarios
cover RU/EN desktop/320px, keyboard and boundaries, total versus direct distance,
explicit diagonal policy, undo/clear/reopen, visible cursor and map total,
zoom/scroll, real Chromium touch/cancel, tool switching and nested combat dialogs.
All action/transport boundaries are mocked and external browser requests are
blocked. Existing campaign UI and actual Next production CSS regressions also
run. Offline tests and deployment readiness do not prove authenticated live UX.
