# Bestiary cards and mobile details

Display-only update, 2026-10-31.

- Card names and custom type/size chips wrap without truncation. Known categories use RU/EN dictionary labels; unknown categories retain source text.
- Card actions have visible labels and minimum 44px height; actions stack on small screens. Add still opens the existing review dialog; it does not write immediately.
- Detail statistics use labelled groups. Ability scores use three columns on mobile and six from the small-screen breakpoint. Missing scores and modifiers show a dash rather than inventing 10 / +0.
- Card and detail HP both use hp, then legacy hp_max, then a dash. Zero speed is displayed instead of being treated as absent. These are catalog display values only.
- The description wraps long source text. Close is localized, available in the footer to readers, and 44px high. Editor footer actions stack on mobile.

## Boundaries

No server action, parser, search filter, import, rules or authorization change. No database/schema/player/HP writes, data backfill or live source request. Unknown source descriptions and alignment are not automatically translated. Existing HP write-path restrictions still apply.

## Verification

Six additional offline real-component browser scenarios cover RU/EN at 320px reader, 390px editor and desktop reader widths. They exercise known/missing/custom categories, unbroken names and descriptions, stat and modifier preservation, missing-score dashes, hp_max, zero speed, column layout, labelled 44px actions, Close/Escape, and absence of write calls while browsing. Existing catalog pagination/filter tests remain included. Synthetic fixtures do not establish authenticated live campaign or RLS/write acceptance.
