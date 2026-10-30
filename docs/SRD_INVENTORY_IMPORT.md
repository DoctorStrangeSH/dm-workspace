# SRD item import metadata — 2026-10-30

## Problem and behavior

addSrdItemToCharacter previously copied only name, quantity, weight and a short description. It dropped catalog item_type and rarity, so newly imported items lacked category/rarity badges and fell into legacy Other/Common filters.

The action now adds metadata through srdInventoryMetadata. Existing name/weight/notes behavior is retained. It appends exactly one new item to the original inventory and calls the existing update_character_data_cas once with the original character JSON as p_expected. The rest of the document is retained, including unknown extension fields and existing item metadata. No retry occurs on stale CAS or RPC errors; no success revalidation occurs after failure.

Malformed catalog or character JSON containers are refused. A non-null, non-array inventory is refused instead of silently discarding it. Missing/null legacy inventory can still receive its first item. Existing owner-or-DM application checks, character/campaign query filters, UUID generation and 500-item cap remain.

## Conservative display mapping

- Weapon → weapon.
- Armor and Shield → armor.
- Ammunition, Potion, Poison and Scroll → consumable.
- Tools → tool.
- Wondrous Item → wondrous.
- Other categories → other, including Ring/Rod/Wand/Staff/Spellcasting Focus. The six inventory display categories cannot express every catalog category; these categories alone do not imply magic or an equipment bonus.
- Canonical inventory category names are supported too. Case, surrounding whitespace and space/underscore/hyphen separators are normalized.
- Only common, uncommon, rare, very rare/very_rare/very-rare, legendary and artifact produce a saved rarity. Unknown/missing/structured values omit rarity; no name/description inference. Existing UI still treats absent rarity as Common for legacy filtering and shows no explicit rarity badge.

These are display/filter categories, not consumption mechanics or armor/initiative calculations. Importing an item does not equip or attune it.

## Read-only catalog evidence

Project identities were verified with Supabase list_projects. Aggregate SELECTs of public.srd_items, grouped only by JSON shape/type/rarity, returned the same distribution for dm-workspace (DEV, yoondivyeueyrtgeldja) and dm-workspace-prod (klzziumdjpagqquihpks): 540 object records, 20 categories, all saved rarity values common. The seed transforms category.name and rarity.name into flat fields. The evidence describes these two named projects; no Vercel environment secrets were read to infer a deployed backend binding.

No catalog rarity was changed or invented. Rare/very-rare import cases in tests are synthetic forward-compatible coverage, not proof that rare records currently exist. Existing inventory items are not backfilled.

## Verification and limits

Seven new tests execute the real action module with recording auth/database/cache boundaries and the real metadata helper. They cover all 20 observed categories, supported rarities/normalization, unsafe/unknown inputs, complete JSON preservation, owner/DM/denied access, scoped reads, malformed containers, cap, distinct IDs, stale CAS and RPC failure. They also verify imported labels through the actual RU/EN display helpers. The tests run in test:characters and therefore CI.

No schema migration, catalog/player-row mutation or installed HP RPC call is needed. Querying catalog distributions is read-only; recording action tests do not establish authenticated database/RLS persistence. Existing campaign owner-vs-DM semantics and coordinated HP writer limitations remain separate audited work. User confirmed #250 UI works before this follow-up.
