# Compact combat workspace

The turn timeline starts with compact horizontal participant cards. The Compact view
toggle switches to the detailed portrait cards without changing order, initiative,
conditions or the current participant. Show all works in either density. Full names
wrap instead of being truncated; accessible names retain the full condition list.
Changing density recenters the current participant in the strip, without moving the
page or map. The preference is local to the mounted timeline and resets on navigation.

The combat panel keeps its close button, current/next status and primary turn action
above one scrolling content area. Filters, participants and combat management actions
share that area; the participant list no longer adds a second scrollbar. Short Roll
labels keep participant actions on one row on narrow screens. Named accessible labels
and the existing reroll/end confirmations remain.

Hidden participants are filtered by the existing display rules before either card
density renders. This is a presentation change, not a database authorization fix.
No server actions, RPCs, HP, initiative, movement, subscription or database schema
changes. Existing multi-client combat races and HP coordination remain separate work.

Offline browser checks cover RU/EN, light/dark desktop and 320px, card height/order,
keyboard density switching, expanded layout, fixed controls while scrolling, focus
visibility, focus return and hidden-player participants. Existing combat action,
confirmation, pending/error and synchronization scenarios run in the complete suite.
Synthetic tests do not establish authenticated live campaign acceptance.
