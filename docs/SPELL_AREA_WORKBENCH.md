# Spell area workbench

The scene and session map's Areas button opens a local planning panel for circle, cone, line and square previews. It is available to both roles and never calls server actions, changes HP, consumes spell slots, moves tokens or shares an area with other clients. The interface explicitly explains preview visibility and that the DM resolves hits and cover.

Presets provide Fireball (20 ft radius), Burning Hands (15 ft cone), Lightning Bolt (100 × 5 ft line) and Thunderwave (15 ft square footprint). These are dimension shortcuts, not spell casting or automatic rule enforcement. One grid unit is 5 ft on every grid type. No cell-inclusion, collision, fog visibility, range, height or cover inference is performed.

Circle uses the selected radius. Cone uses a triangle whose forward length and far width equal the selected length, replacing the former 60-degree circular sector. Line has a fixed selected length and independent width; dragging selects direction, fixing the old behavior that ignored configured length. Square uses the selected side length, centered on the chosen point, and can rotate. The square is a 2D footprint; choosing a legal spell origin is the DM's decision. All geometry is expressed in unscaled grid coordinates and clipped at the map boundary. Size labels and anchor markers remain readable across zoom.

Dimensions accept finite values from 5 to 300 ft. Invalid or empty drafts display an error, retain the previous geometry and revert on blur; valid drafts update the preview immediately. Source dimensions and placement persist across shape/preset changes. Leaving the area tool clears placement; reopening starts clean. Placement is keyed to scene identity.

Press/drag places the origin on a grid vertex and determines direction. Pointer-up uses the final pointer position. Pointer cancellation or unexpected capture loss restores the prior preview; a completed gesture retains the new placement. The overlay intercepts interaction so tokens cannot be dragged accidentally. Place in map view anchors the preview in the visible map portion and focuses the placement layer.

With the placement layer focused, arrows nudge one grid unit, Shift + arrows rotate 15 degrees, Enter/Home place at map center, and Escape closes the tool and restores focus to Areas. Rotate buttons provide the same adjustment. Clear removes only the local preview. Escape in a nested combat confirmation/dialog is handled by that dialog and preserves the area tool.

Validation includes pure geometry tests for fixed line dimensions, rotations, cone proportions, square center, circle radius and bounds. Seven isolated browser scenarios exercise RU/EN, desktop/320px, player access, preset and numeric editing, reset/focus, keyboard, zoom-invariant geometry, touch cancellation and nested combat Escape. All external requests/action boundaries are mocked. Authenticated live campaign acceptance remains separate.

Existing HP coordination, non-atomic combat actions, global snapshot ordering and multiple-client movement limitations are unchanged.
