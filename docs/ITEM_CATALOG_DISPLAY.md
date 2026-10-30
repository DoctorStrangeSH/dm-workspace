# Item catalog labels and card readability

The catalog now shares display labels for the 20 retained item categories between
search filters, cards and item details. RU uses Russian labels; EN uses canonical
English labels. Matching normalizes case/spacing for display lookup only. Unknown
string categories retain their source text, and invalid non-string labels are blank.

Raw category values still drive selection, server search and imports. This change
does not group or rewrite source categories into inventory mechanics. The 20 labels
were checked against the retained 440-row catalog backup plus the validated 760-row
magic item source from the prior import; no new database read or write was required.
Source item names, descriptions, prices, units and provenance remain as supplied.

Cards show full wrapping names, separate category/attunement chips, a rarity header
and labelled cost. Both detail and add controls have at least 44px touch targets;
the add control has visible text and an accessible name on narrow screens.
The item dialog close label follows the selected language. A reproduced overflow
with an unbroken long item name also required wrapping in shared dialog titles and
descriptions; dialog behavior, focus handling and action paths are unchanged.

Offline browser checks use actual catalog components with synthetic long names and
unknown categories in RU/EN, with and without character choices. They verify
wrapping, touch sizes, translated filters sending the original Wand value, detail
opening, localized Close and absence of writes while browsing. The existing suite
also covers chat/dialog focus, paging/search failures and other campaign layouts.
These fixtures do not establish authenticated live campaign or RLS acceptance.

Verification: npm run test:campaign-ui; typecheck; lint; git diff --check; CI build.
Synthetic screenshots are in test-results/campaign-ui/mobile-item-cards-{ru,en}-{editor,reader}.png.
No schema, import, player/HP mutation or equipment bonus mechanics are included.
