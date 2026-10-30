# Spell catalog card readability

Spell cards now share the item catalog visual structure: level header, full
wrapping name, school/ritual/concentration chips and 44px detail/add actions.
Casting time, range, duration and components are visible as labelled definition
lists. Missing values use an em dash; cantrip level zero remains explicit.

Card and dialog school labels share a display-only helper. Known schools use
existing RU/EN translations; blank schools show an em dash and unknown schools
retain source text instead of a missing translation key. Details translate known
class names using the existing class display helper, supporting title-case source
names and SRD-prefixed keys. Unknown class names remain unchanged. Source names,
parameter values, descriptions and class/school keys are not rewritten.

The spell dialog close label follows interface language. Its character selector
has an accessible name and a 44px target; the selector and add action stack on
mobile to prevent crowding by long character names. Description/parameter text
wraps. Existing parser, authorization, data loading and add action paths remain.
This work neither changes ritual/concentration rules nor introduces spellcasting
mechanics, imports, schema changes or player/HP writes.

Offline Chromium uses the actual client/card/dialog with synthetic known, blank
and unknown schools, long names, absent values, ritual/concentration, class labels
and higher-level text. Six new RU/EN scenarios cover mobile reader/editor and
desktop reader views, 44px controls, labelled character selection, details/Close,
source fixture preservation and no writes while browsing. Existing paging/error/
late-response and campaign scenarios remain in the suite. These fixtures do not
establish authenticated live campaign or RLS/write acceptance.

Checks: npm run test:campaign-ui; typecheck; lint; git diff --check; CI build.
Synthetic screenshots: test-results/campaign-ui/spell-{card,detail}-{ru,en}-{mobile-reader,mobile-editor,desktop-reader}.png.
