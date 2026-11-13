# Character play workspace

The character sheet uses the available screen width and groups the spellbook, inventory,
abilities and personal rolls into one workspace. On wide screens the action panel stays
beside the active tab, below the measured campaign header; its contents scroll within the
viewport. Narrow screens stack the sections with touch-sized controls.

## Play tools

- The action panel displays valid HP, armor class, initiative and speed. Ability checks
  and saved attacks support normal d20, advantage and disadvantage. Both raw d20 rolls
  remain visible, and the modifier is added once to the selected roll.
- Damage supports a single `XdY±Z` expression (up to 20 supported dice and a ±100 modifier)
  or a constant from 0 to 100. Damage cannot be negative. Unsupported formulas remain
  editable text and produce an inline explanation when rolled. Hits and critical damage
  are resolved manually. The last five rolls exist only until the sheet is unloaded;
  they do not post to chat, spend resources, or modify HP.
- The spellbook filters rituals and concentration and displays spell attack bonus/save DC
  when a casting ability is present. Always-prepared spells count as prepared and do not
  expose a preparation toggle. Known school/time/range labels localize for display;
  custom source text, names and descriptions are retained.
- Inventory supports equipped/attuned/backpack scopes, description search, name/weight/
  quantity sorting, expandable descriptions and permanently visible item controls.
- Features, traits, attacks and notes can be edited in the Features tab. Attacks become
  available in the action panel after fresh character data arrives.

## Saving and boundaries

Feature edits pass the complete snapshot captured when the editor opened to the existing
`updateCharacter` action as `expected_data_json`. The action's authorization, validated HP
gate and compare-and-swap remain authoritative. A local stale-data check preserves the
draft and stops submission. A synchronous guard blocks duplicate saves. An uncertain
transport result is displayed without automatic retry. Unrelated HP, spells, inventory,
currency and other character fields are retained.

Tabs retain mounted content so filters, card expansion and unsaved feature drafts survive
tab switching. Inactive content is hidden from interaction/accessibility navigation.
Unsaved edits and personal rolls are not persisted across page reloads.

No server action, schema, migration, installed HP RPC or live database was changed for
this feature. Existing slot, rest and item actions continue to use their existing paths.

## Verification

`npm run test:campaign-ui` includes three module tests and ten focused browser scenarios
for this workspace: RU/EN, light/dark, desktop/320px, raw dice, unsupported expressions,
tactical filters, preserved tab state, save failures/uncertain outcomes/success, exact
snapshot payload, concurrent refresh, duplicate submission and editing permissions.
The broader character suite verifies existing server action and HP boundaries.

These checks use synthetic data and mocked transport. An authenticated live campaign
acceptance is still separate; synthetic success does not establish live database writes.
