# Saved personal session response

Session cards show the authenticated viewer's saved RSVP, or an explicit unanswered label, in Russian and English. Future-session buttons use a check mark, primary styling and aria-pressed for the saved choice. Past and invalid-date cards retain the response summary without enabling new RSVP controls.

The server page passes viewerId from the existing getCampaignAccess/auth.getUser read; no additional auth request or database query is introduced. This ID is display-only. The unchanged setRsvp action independently authenticates the writer, checks campaign membership and upserts that user's response. No schema changes or automatic browsing writes.

Pending and failed requests preserve the previous saved response. Returned errors and transport exceptions appear inline, with retry controls available after completion. Successful actions refresh server data; no optimistic state is labelled saved. Updated server props control both the personal choice and totals.

Validation: actual access/action modules execute against a recording in-memory boundary; browser scenarios cover all saved statuses versus another participant, no response, pending/error/transport/retry, keyboard submission and replacement server props, RU/EN mobile layout. The existing card/form/navigation suite remains in CI. All browser networking is restricted to the local fixture server. Synthetic coverage does not establish authenticated live campaign/RLS/write acceptance.
