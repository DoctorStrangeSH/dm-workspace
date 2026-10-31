# Session cards and mobile controls

Display update, 2026-10-31.

- Session titles and descriptions wrap, including unbroken words; description line breaks are preserved. Past sessions keep normal text contrast and a Past badge.
- Date/time and duration are separate metadata rows on mobile. A semantic time element retains starts_at. Timezone is explicit: the server and first hydration render use UTC, then the browser timezone is used with the chosen RU/EN locale. This is viewer-local time, not a new campaign timezone setting; input/storage semantics are unchanged.
- Invalid dates show a localized unavailable label and have no response controls. Past sessions also have no response controls. Neither condition changes stored data.
- Response counts have localized text labels and semantic terms/values. The response group is labelled and its buttons are at least 44px high. It does not claim to show the current user's selected response.
- Delete is a visible 44px action with a session-specific accessible name. The existing confirmation dialog also shows the target session title. Cancel/Close does not write. Mobile confirmation and create actions stack. Dialog Close is localized, and dismissal is blocked during submission.
- Create fields are at least 44px high. Existing server action inputs, validation, authorization, response counts and refresh behavior are preserved. Returned failures appear inline within the delete confirmation or create form and retain the draft for retry; error toasts no longer cover those dialog actions.

## Verification boundary

Eight additional offline real-component Chromium scenarios cover RU/EN, 320px player and form views, 390px DM views, and desktop. They check long names/descriptions, timezone-labelled locale formatting, counts, missing/invalid/past dates, empty-state permissions, labelled touch controls, target-title confirmation/cancel and zero writes during browsing. Explicit RSVP/delete/create tests call in-memory mocks only and check arguments, pending state, returned failure and deliberate retry.

No live session/player/HP/database/schema writes, source import, server action or RLS change. Synthetic fixtures and deployment metadata do not establish authenticated live campaign acceptance.
