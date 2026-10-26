# DEV atomic HP acceptance gate

Environment ownership confirmed by user: `dm-workspace` = DEV, `dm-workspace-prod` = production. Never run this prototype against production.

## What this PR does
- Tightens the SQL review prototype: absolute HP setting requires the caller's expected current HP; linked character JSON numeric values are checked before integer parsing.
- Does **not** install the prototype as a migration or update game data.
- The prototype has not been executed: CI syntax checks on TypeScript do not constitute a PostgreSQL concurrency or security test.

## Security review before DEV execution
- Confirm the precise function owner and `SECURITY DEFINER` privilege posture; a definer may bypass RLS. Audit schema grants, PUBLIC grants, and authorized access to the RPC through PostgREST.
- Consider splitting into a private non-exposed definer function plus a narrow API wrapper; verify the wrapper cannot be called with user-swapped identity.
- Review `characters.data_json.hp` validation against historical character shapes.
- Enumerate and migrate all direct HP writers in the same rollout, including character editor and token HP editors; otherwise mixed paths can still corrupt state.
- Review whether using `FOR UPDATE` in a joined query is supported for the actual relations, and run an execution smoke test with a rollback on an isolated fixture.

## DEV-only tests after explicit approval to mutate
1. Make disposable scene, campaign, character, token, owner accounts.
2. Damage -3 and -4 concurrently from 20 should result 13 on token and character.
3. Both damage and heal must serialize without lost increments.
4. Failures inside the function must roll back both writes.
5. Test DM, owner, added owner, nonmember and cross-campaign access.
6. Verify ordinary character JSON properties remain unchanged and RLS privacy isn't broadened.
7. Clean up fixtures; record tests and expected results in the PR.

Do not interpret schema metadata queries or a successful CI run as proving any of these behavioral tests.
