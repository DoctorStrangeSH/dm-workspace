# Campaign cards and confirmations

Dashboard cards show full campaign names in linked headings, wrap long genres/invite paths, retain a short description preview and expose labelled 44px copy/regenerate/delete controls to DMs. Player cards retain their campaign link without management controls. Copy feedback belongs to the code actually copied; refreshed server codes replace a local confirmed regeneration result.

Opening, inspecting and cancelling a confirmation performs no server action. Regenerating an invitation now requires a confirmation naming the campaign and warning that the previous link stops working; existing members stay in the campaign. Deletion retains its targeted warning. Confirmations localize Close, stack mobile actions, block dismissal while pending, keep returned errors inline and refresh the dashboard after success. Transport exceptions advise refreshing and checking the campaign before repeating an operation; no automatic retry is added.

The create dialog has localized Close, 44px inputs, a mobile footer, an inline alert and pending submission/dismissal guards. Returned and transport failures retain entered fields. Successful creation refreshes the dashboard. Existing stored genre values remain unchanged.

Backend actions, authentication, ownership checks, membership and database schema are unchanged. This work performs no live campaign/player/HP/database mutation. Offline browser tests replace all campaign actions and clipboard access with recording stubs, block remote networking and cover RU/EN, 320/390px/desktop, player controls, copying, cancellation, pending, returned/transport failures, deliberate success and replacement server props. Production browser navigation timed out; authenticated live acceptance remains unverified.
