# Scene workspace and private token art

The scene uses the available campaign width. A responsive participant panel sits beside
the map on wide screens and below it on smaller screens. Participants can be searched,
filtered into heroes and other creatures, and located on the map without writing data.
The panel can be hidden to give the map more space. The existing turn timeline,
combat drawer, map upload, zoom, pan, ruler, spell areas and routes remain available.
Fullscreen hides the scene heading and timeline to prioritize the map; the toolbar
still provides the fullscreen exit control. Exit fullscreen to return to the timeline.

The map and participant panel share one `useRealtimeTokens` subscription. Players do
not render hidden tokens received in a broadcast. The movement queue and revision
comparison are unchanged. Initiative retains its own existing synchronization.

## Token images

Select a token on the map, choose an image in **Token appearance**, inspect the preview,
then save. PNG transparency is preserved; JPG and WebP are also supported, up to 2 MiB.
Images fit inside the token and portrait instead of being cropped. Unreadable map and
combat portraits fall back to their icon. The DM or primary token owner can upload.
Additional movement ownership does not grant image upload permission.

Files live in the private `token-art` Storage bucket with immutable random names under
`campaign/scene/token/revision.ext`. MIME and signature checks reject unsupported
uploads. Bucket size/MIME rules provide another boundary. The action authenticates,
checks membership and ownership, then updates only `image_url`, scoped by token,
scene, campaign and previous image equality. A stale replacement cannot overwrite a
newer one; movement and HP are not included in the update.

The private image route resolves the current token image and checks membership,
visibility and path scope. Storage RLS independently requires membership, visibility
and a currently referenced path. Upload requires DM or primary ownership. No public
read, overwrite, delete, service-role client or privileged helper function is added.
Redirects use private/no-store caching and 60-second signed URLs. An already issued
signed URL may remain usable for up to 60 seconds after visibility changes.
Existing HTTP(S) portraits and bounded embedded raster portraits are retained. SVG,
script URLs and arbitrary relative paths are not accepted by the image resolver.

Old or uncertain uploads are retained privately rather than deleting a possibly
referenced image after a lost response. They are not readable through the current-image
policy. A future storage cleanup must recheck references before removing files.

## Deployment and verification

Apply only `20261114073437_private_token_art.sql` after its isolated SQL tests pass.
It adds one bucket and two policies; no application table changes or gameplay writes.
Do not use a bulk migration push: the older entity-template migration has a known
local/history timestamp mapping documented in the project handoff.

`tests/token-art.test.ts` exercises actual action/route exports against an offline
Supabase SDK transport. `supabase/verification/token_art_ci.sql` runs the actual
migration and role assertions in disposable PostgreSQL, ending with rollback.
Browser tests cover desktop/mobile, Russian/English, participant updates, local focus,
hidden tokens, preview, cancellation and failed upload retry. Real Next production
CSS tests check responsive columns and map height. Live authenticated campaign
acceptance must be reported separately from offline tests and deployment readiness.
