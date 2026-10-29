# Campaign overview and chapter editor - 2026-10-29

## Behavior

The overview presents a campaign identity panel and a role-specific next step: the GM opens the existing game workspace or active scene, while a player opens character sheets. Both roles get labelled shortcuts to characters, chapters, scenes and sessions. Existing server access checks and queries are preserved; presentation is extracted into a separately testable component. Reference books remain in the main navigation.

Statistics, preparation checks, activity types and relative dates follow RU/EN. Hidden-chapter count labels and the preparation checklist appear only for the GM. This is presentation filtering, not a new database authorization guarantee. The existing RPC's data remains authoritative. Entity breakdown includes notes. Recent activity has an explicit empty state, uses one request-scoped time and handles invalid dates without rendering an invalid-date label. An unavailable statistics response is distinguished from an empty set of world materials; section links remain available in both cases. No claim is made that chapters/entities represent all campaign content.

The chapter editor has labelled 44px formatting and view targets, visible pressed states, theme-correct active contrast, a translated placeholder and wrapping save status. Mobile Preview hides formatting controls and returning to Editor retains the draft. Read-only CodeMirror no longer receives the save callback, so Ctrl+S cannot invoke that callback. Write authorization remains server-side. Formatting snippets, autosave implementation, Markdown parsing and export implementation are otherwise preserved.

The global mobile main style changes horizontal/top padding without overriding the page's bottom reservation for fixed navigation. The activity grid explicitly uses a shrinkable single column before its wider breakpoint, preventing long titles from widening tablet layouts.

## Verification

The ordinary offline campaign UI command runs 6 pure navigation/date tests and 19 Chromium scenarios, including 6 overview/editor scenarios. The fixture uses the real overview, statistics and CodeMirror editor, actual Tailwind styles and explicit in-memory navigation/message/Realtime/theme/chapter-save/export boundaries. Search and secondary header actions remain visual layout placeholders. Other origins are blocked; no environment secrets or remote database are needed.

Coverage includes GM/player actions, RU/EN statistics and activity, notes links, empty/unavailable states, 320/390/768/1440 widths and long text, bottom-navigation clearance, actual selection formatting, mobile/desktop view switches, retained content, save errors and read-only editing/save prevention. Generated screenshots are synthetic fixture data. Existing 36 character regressions remain separate.

These tests do not establish authenticated campaign access, live saves, export delivery, chat/Realtime or real-device keyboard acceptance. No live HP RPC, mutating harness, schema or player-data change is part of this work. The known coordinated HP writer, authority and migration-provenance prerequisites remain open.
