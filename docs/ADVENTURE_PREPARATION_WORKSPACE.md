# Adventure preparation workspace

The creation wizard, scene library and empty chapter archive now help users prepare
an adventure, using the existing persistence and authorization paths.

## Character creation

- A wide layout displays a live hero preview alongside the current step. It shows final
  ability scores including the selected species bonuses, HP, unarmored AC and initiative.
- Suggested scores prioritize the class's primary abilities, then Constitution/Dexterity.
  They spend exactly 27 point-buy points or use the complete standard array. Applying
  a suggestion explicitly replaces the current base scores; users can edit afterwards.
  Known SRD classes now use their actual base-class primary abilities instead of a
  universal Strength placeholder.
- Completed step buttons allow backward navigation. Step headings receive focus and
  account for the sticky campaign header. Inline guidance explains incomplete steps.
- Changing background removes class selections that duplicate its granted skills.
  Final submission revalidates identity, integer level 1–20, scores and unique eligible
  class skills. A synchronous guard prevents duplicate creation. Explicit server errors
  allow a manual retry; an uncertain response retains the form and locks creation until
  the user checks the character list/reloads. There is no automatic retry.
- Newly created higher-level characters use `hitDie + CON modifier` at level one, then
  `max(1, floor(hitDie/2) + 1 + CON modifier)` per additional level. First-level HP is
  unchanged. This does not recalculate existing characters or grant class features,
  ability improvements, equipment or spell resources automatically.

## Scenes and chapters

Scenes have local name search, active/map/blank-grid filters and active-first/name
sorting. Clearing filters never changes the scene data. Cards show full names, a grid
placeholder, an explicit table link and touch-sized actions. Opening a table is distinct
from activating it for the party. Existing actions retain server-side authorization;
local guards prevent duplicate activation/deletion requests and failures are inline.
The scene library and battle page use the available wide-screen space. Combat order,
token movement and HP synchronization are unchanged by this release.

An empty DM chapter archive offers three title starters with story-planning questions.
Selecting one opens an editable, accessible creation dialog. It does not create anything
until the user submits, and it does not generate or publish chapter contents. The normal
chapter button uses the common theme and translated label. Player creation controls
remain hidden.

## Verification and limits

Offline browser scenarios cover RU/EN, light/dark, desktop/320px, complete creation,
both ability methods, SRD primary ability, higher-level HP, background conflicts,
duplicate/failed/uncertain submissions, scene browsing/delete errors/read-only role,
chapter title starters and dialog keyboard dismissal. Module tests cover all base-class
presets, exact standard-array length, skill eligibility and HP at levels 1/2/5/20.

No server action, schema, migration or installed HP RPC was changed. No live database
was mutated during development. Synthetic transport checks do not establish live
authenticated campaign acceptance.
