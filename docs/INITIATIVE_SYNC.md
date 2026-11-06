# Initiative refresh synchronization

The scene/session combat queue keeps its existing Postgres Changes subscriptions and member-scoped reads. This change does not alter publication settings, authorization, schema, combat writes, or HP writes.

A queue read that started before new server props arrived cannot replace those props, including while linked-character/entity armor is still being fetched. A scene or subscription change invalidates work from the previous scope. Cleanup removes the channel and scheduled refresh; already in-flight reads are ignored after disposal.

Events are coalesced for 40ms and only one complete refresh runs per mounted hook at a time. An event arriving during a read invalidates that snapshot and schedules one follow-up read. Character and entity armor lookups run in parallel with duplicate IDs removed. The queue has stable turn_order/id read ordering and accepts authoritative empty results.

Token UPDATE events that only change map coordinates or timestamps do not reload the initiative queue. Participant names, portraits, ownership/source links, visibility, HP display, color, size and conditions still trigger a read when they differ. Partial events with no display fields conservatively trigger a read. Changes for a token outside this queue do not trigger a read.

Query errors or rejected promises preserve the last readable queue, without unhandled promise rejections or automatic retry loops. A later event or SUBSCRIBED/reconnect reconciles again. No realtime connection status indicator is added by this change.

## Verification

The actual production hook runs in offline Chromium through an in-memory Supabase read boundary; external requests are blocked. Tests reproduce the original delayed-response rollback before the fix and cover server props, event bursts, movement-only events, visible token changes, hidden player cards, read failures, reconnect/empty results, delayed armor enrichment, duplicate source IDs, relation shapes, scene changes, disabled subscriptions and unmount cleanup. No live combat/player records are changed. The final local checks passed 128 browser scenarios, 9 navigation/date/identity tests, 17 map/combat/movement tests, type checking and formatting. Lint reports no errors and one existing cleanup warning in use-realtime-tokens.

On 2026-11-06 a read-only Production metadata query confirmed public.initiative and public.tokens are both in supabase_realtime. This is not an authenticated end-to-end acceptance test.

## Limits

The hook does not provide a database transaction or a global scene revision. Multi-request combat writes can still expose intermediate states or race across DMs. Server-prop snapshots themselves are not globally ordered against later live snapshots. This fix rejects older asynchronous work within the mounted hook; it does not introduce distributed token locking or repair the separate HP writer coordination issues.
