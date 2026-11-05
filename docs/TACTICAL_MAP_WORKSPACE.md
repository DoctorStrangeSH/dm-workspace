# Tactical map workspace

The scene page and session scene panel share the new battle table. An aspect-preserving background fills the existing board without cropping (different image proportions leave margins). One native-size stage holds image, grid, walls, fog and tokens. Fit-to-view observes the actual viewport, manual zoom preserves its center, Pan drags the scroll view, and native full screen is available where supported. Keyboard arrows scroll the focusable map region. Token menus render outside the scaled stage, including inside native full screen; token selection has keyboard access and derives current token data from Realtime.

## Upload

DMs have a visible upload/replace action at every width and a blank-board prompt. File selection/drop is local until explicit confirmation. PNG/JPEG/WebP, one nonempty file, at most 10 MiB, native decode, dimensions, grid preview and a clear geometry-preservation notice precede submission. Pending operations prevent duplicate submission/dismissal. Returned errors preserve the preview; unknown transport outcomes block repeating in that dialog and instruct refresh/readback. Object URLs are revoked and stale load/error callbacks ignored. Existing upload authorization, campaign/scene checks, private scene-maps storage, unique object paths and member-only map redirect remain unchanged. Opaque image revisions reload a replaced background without placing storage paths or signed credentials in the image request.

## Tools and turns

Ruler, area templates and fog brush derive coordinates from the transformed layer bounds, clamp to the board, and accept pointer events including native touch/cancel. The ruler explicitly measures straight-line distance at 5 feet per cell. Existing template shapes are visual aids, not automated rules adjudication. Walls use the same conversion with half-cell snapping. Selecting a tool exits fog editing; Escape cancels the tool without consuming modal dismissal.

Turn order docks beside a wide table and below a narrow table, including the embedded session panel. Current/next participant, full names, initiative values, preparation, deliberate roll-all/start-first/advance actions and map focus replace the fixed covering panel. Zero is treated as a valid initiative result. Rerolls during a turn require confirmation; ending combat is confirmed. HP is displayed read-only in this queue: its unsafe quick mutation actions were removed. Existing separate TokenMenu HP writers remain outside this repair; see HP_WRITE_PATH_AUDIT.md.

Initiative actions retain DM authorization. Preparation refuses an already populated queue rather than deleting it. New entries have distinct stable initial order; ties sort by entry id. Reordering changes turn_order only, preserving the current participant and leaving preparation inactive. Roll-all recalculates once after the batch. Advancement walks ordered entries by id rather than assuming contiguous order values; current-read failures stop writes.

These are still multiple database requests. No transaction, scene-wide lock, atomicity, or cross-client race fix is claimed. Simultaneous DM controls, partial writes and failed rollback remain a separate database design task. No schema changes or installed HP RPC calls are part of this release.

## Verification

Offline geometry and actual-action recording-boundary tests cover zoom/scroll/snapping, fit, file limits, opaque revisions, gaps/ties/deletion/wrap, preservation of current/preparation, one batch reorder, DM denial, read failure and stale preparation. Browser scenarios cover RU/EN, 320px/desktop, narrow session embedding, zoom/ruler/pan, native Chromium touch cancellation, upload validation/preview/pending/errors, confirmation, keyboard token selection and player restrictions. All action and Realtime boundaries are mocked and external networking is blocked. Synthetic map images are test fixtures only. Authenticated live campaign writes and device-specific full screen are not asserted by these tests.
