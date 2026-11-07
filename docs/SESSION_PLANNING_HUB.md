# Session planning hub

The sessions page now surfaces the next game before later dates. Games stay current until starts_at plus duration_minutes; an in-progress badge explains this state. The archive is collapsed by default and sorts newest first. Unknown dates or unusable durations remain visible in a separate review group. Sorting does not modify the source records.

A request-scoped server timestamp produces a consistent first render. After hydration, a local clock refreshes every30seconds and on focus/visibility changes. Existing browser-zone date formatting remains; no countdown, attendance inference or automatic campaign start is added.

Preparation links point to characters, scenes and the game workspace for the master, and characters, chat and chapters for a player. Existing permissions remain authoritative. Saved RSVP selections, explicit response actions and deliberate deletion confirmation remain available in their original form; archived games have no RSVP controls.

The Add to calendar button downloads a local RFC5545 .ics file. It contains the session title/description, UTC start/end, stable event UID, export timestamp and a campaign sessions link. It excludes participant identities, attendance records, invitations and credentials. Text is escaped and UTF-8 lines fold at75octets. Invalid date/duration/export timestamps produce no file. Browser download failures show a local error and allow explicit retry. Object URLs are revoked shortly after the download starts.

The file is an export, not a subscription: later date changes must be imported again. Calendar application import behavior can vary; automatic updates, reminders and email delivery are not provided.

No query, server action, schema, role, HP or Production data mutation is introduced. No real calendar, account or campaign is created for testing.

## Verification

- Pure helpers cover ongoing/end boundaries, future/archive ordering, malformed data, nonmutation, UTC conversion/duration, stable UID, escaping/injection and UTF-8 folding.
- Offline Chromium exercises RU/EN, light/dark,320px/desktop and both roles; actual .ics downloads, keyboard archive controls, in-progress/end transitions via the local clock, refreshed ordering/RSVP selection and download failure/retry. Recording boundaries verify no browsing/download writes.
- Existing full campaign and production-build CI checks remain required before release.
