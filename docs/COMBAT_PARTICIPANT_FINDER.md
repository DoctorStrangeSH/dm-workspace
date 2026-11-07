# Combat participant finder

The combat panel can filter an existing queue by name or condition, participant source (character-linked, creature-linked or unlinked token), and presence of conditions. Filters combine and affect only the displayed list: the turn order, current/next participant and existing DM actions still use the complete authoritative queue. Displayed positions remain positions in the full visible queue. Reset clears all criteria and returns keyboard focus to search.

Search matches all whitespace-separated words, ignores case, normalizes Unicode compatibility forms and treats Russian е/ё alike. Known conditions match their canonical English key and translated label; custom labels remain unchanged. Counts and search data are built after excluding hidden entries for players. Hidden current/next names still use the existing generic label. This is a display safeguard, not a database authorization change.

Condition badges appear in the panel and turn timeline. The timeline shows two badges plus a count of the rest; its accessible card name includes every condition. The panel shows the full list. Display normalization ignores malformed condition values, trims names and deduplicates known condition names without writing back or applying effects. RU/EN labels and 44px filter targets support narrow screens and keyboard use.

No database, schema, server action, subscription, HP, initiative formula or game-rule changes. Existing non-atomic combat actions, cross-client token movement and coordinated character/token HP limitations remain unresolved; see HP_WRITE_PATH_AUDIT.md and MAP_COMBAT_SYNC_FIX.md.

Seven isolated browser scenarios cover RU/EN desktop/320px, combined criteria, reset/focus, unchanged current turn, preserved visible positions, server prop updates/removal, hidden player entries, malformed/custom conditions and conflicting current flags. External network and action boundaries are mocked; authenticated live campaign acceptance remains separate.
