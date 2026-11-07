# Invitation and first-campaign onboarding

Guests keep a validated internal return path through the authentication proxy, login, signup and form-switch links. An invitation notice explains the destination. The same allowlist is applied at every navigation boundary; external, protocol-relative, encoded-path, dot-segment, auth-loop and API destinations fall back to the dashboard. Session refresh cookies survive redirects with private, no-store caching.

Registration navigates onward only when Supabase returns a session. Without a session, it clears the password and presents a check-email panel with an invitation-preserving login link. The user confirms their address using the email, then returns and signs in. This release does not add a callback endpoint, change email templates or promise automatic return from email; Auth configuration remains unchanged. Transport failures and returned auth errors are shown inline, with synchronous duplicate-submit guards.

Opening, rendering or prefetching /join/[code] never joins a campaign. A signed-in user must explicitly submit the confirmation form. It calls the existing joinCampaign server action and join_campaign_by_code RPC. Input/auth are checked on the server; a UUID response is required before navigation. SQLSTATE 22023 indicates an invalid invite; 42501 indicates authorization failure. Other RPC/transport/malformed responses show an uncertain-outcome message linking to My campaigns, without automatic retries. The repository RPC uses auth.uid(), inserts only the caller as player and preserves existing membership on conflict. Its schema/permissions and live definition are not changed by this release.

An overview without chapters/entities offers role-specific next links: chapters and map for the master, characters and chat for a player. These are suggestions, not completion-state tracking.

## Verification

- Actual proxy and server modules execute against recording boundaries: allowed/rejected destinations, refreshed cookies, zero render-time RPC/table calls, guest invitation redirect, invalid input/auth checks, single explicit RPC, UUID validation and uncertain outcomes.
- Offline Chromium exercises real login/signup/join components, duplicate submissions, errors, confirmation email state and editing, both languages/themes, 320px layout, keyboard confirmation and role-specific overview links. No real accounts, campaign memberships or remote services are used.
- The isolated real Next production suite follows a guest invitation through the actual proxy and login/signup links, alongside the existing landing/demo checks. Synthetic Supabase configuration only; no form submissions in that production fixture.
- Existing campaign UI, lint, typecheck and build checks remain required in CI.

Live delivery of confirmation emails and authenticated membership changes are not tested using real player accounts. Browser tests and deployment readiness do not establish that live acceptance.
