# Character inventory and spellbook — 2026-10-30

## Verified Git and Production baseline

The reported URL is https://dm-workspace.vercel.app/. Independent Vercel lookup resolved it to READY Production deployment dpl_BoChoKyfWpmYwRP1SNJwiD13Kvvq at main ade603cd3e739464cd1e758fa86872eddab8a109. Git fetch matched that main; its CI 40889090242 succeeded. The refreshed open PR inventory was empty.

The previous UI work was retained, not lost:
- #58–#59 were ported to main in merged #193 (fd84141): accessible spell cards, slot controls and inventory summary/cards.
- #60–#61 were ported in merged #194 (34e35fa): item type/rarity metadata, editing, badges, inventory search and filters.
- #138–#141 were ported in merged #195 (198fe11): mobile touch targets and dialogs.
- Comparing the inventory tab, inventory directory and spells directory at #195 with the baseline main produced no diff.
- Equipment AC/initiative bonus drafts #62–#63 were not delivered. They remain B03 in PR_BACKLOG_TRIAGE_2026-10-28.md and require consistent rules and server validation.

This establishes source/deployment ancestry, not what was rendered in the user's authenticated browser. No authenticated session was available; the in-app browser timed out while navigating to the public root. Do not attribute the report to stale cache or claim it is resolved by a forced refresh without evidence.

## This follow-up

Both character tabs now have an explicit heading and an always-visible link to the campaign's respective SRD catalog. Manual add actions retain their existing edit permissions. Catalog navigation only opens the existing catalog; it does not immediately add anything to the character. Read-only users can browse.

The inventory summary and filters remain visible even when empty; empty search/select controls are disabled. Existing type/rarity badges, grouping, full-inventory weight/currency totals, search and mutation flows are retained. Rarity filter is now 48px tall.

The spellbook adds local name/description search, level and saved preparation-state filters, result count, clear-filters action and no-match guidance. Counts for all spells, saved prepared flags and rituals stay based on the full book. Slots remain visible when no spells match. Filtering makes no server calls and never changes slots or character JSON. Preparation reflects the existing saved prepared flag; this does not introduce a class-specific preparation rules engine or reinterpret alwaysPrepared.

New header/filter copy is RU/EN. Mobile controls wrap and support keyboard focus.

## Verification boundaries

The offline full-character fixture includes valid HP, four spells across three levels, spent/full slot levels, four items including legacy metadata-free equipment and long names. Chromium scenarios cover combined filters, name/description case folding and trimming, reset/no-match states, full totals/slots, empty libraries, read-only access, RU/EN and 390px light/mobile layout. Recording boundaries and before/after fixture comparisons verify filtering makes no character action calls or object changes. These synthetic scenarios do not prove live database persistence.

No server actions, schema, player records or deployed HP routines are changed. Existing HP recovery and linked-token atomicity limitations remain. The SRD item importer currently does not preserve type/rarity metadata; investigate that separately with action-boundary tests before modifying it.
