# Scene participant conditions

The participant panel shows translated condition names instead of a raw effect count.
Known conditions are normalized with the same display-only reader used by combat.
Custom names stay unchanged; duplicate known names, blank names and malformed entries
do not produce extra chips. The source condition JSON is never rewritten.

Search matches participant names, canonical condition identifiers and displayed labels.
Multiple words narrow the search together. Hero/creature and with/without-condition
filters combine with search. Reset restores all filters; counts reflect the current
visible token snapshot. Hidden tokens are excluded for players before filtering,
counting and rendering. No new requests, subscriptions or gameplay writes are added.

Selecting a participant continues to focus the existing map. Condition descriptions
are available to assistive technology. The panel remains scrollable and supports
custom names without spaces on narrow screens. Live condition changes immediately
update chips, search and counts while preserving the chosen filters.

Map token badges also ignore malformed condition entries and translate known tooltip
labels. Valid custom icons remain supported. This prevents null/invalid legacy entries
from crashing the scene; it does not apply mechanical effects or change saved data.

Verification: RU/EN desktop/320px browser scenarios exercise combined filters, reset,
focus, accessible descriptions, live updates, hidden player tokens and malformed data.
Real Next CSS tests cover long custom condition wrapping and filters. Live authenticated
campaign acceptance is separate from offline tests and deployment readiness.
