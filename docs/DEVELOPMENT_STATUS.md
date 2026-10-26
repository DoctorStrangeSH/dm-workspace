# Development status — 2026-10-26

## Verified by user
- Design PRs #45–#50 individually passed manual Preview review.
- Combined interface Preview (#52 based on #51) looked good, except an intermittent HP display issue on character cards (values like `D101` or `null`).

## In-flight (Draft, not merged to main)
- #51: integrated design Preview containing changes #45–#50 and DM shortcuts inherited from #43.
- #52: read-only Playwright integration smoke tests, based on #51.
- #53: guard malformed HP display, based on #52.
- This branch: server-side HP validation for writes and level-up, based on #53.

## Existing work awaiting separate integration review
- #40–#43 and their combined integration PR #44. #43 DM shortcuts also appear in #51 via #47.
- Verify dependency graphs and functionality before release.

## Key risk / next work
- Preview-to-DEV Supabase binding has NOT been independently confirmed. Do not mutate real records from Preview.
- Character `data_json.hp` might contain malformed persisted values. UI guards do not repair these values. Identify origin, then devise explicit validated recovery flow with backup/test coverage.
- Run CI plus manual DM/player/mobile/light-dark testing before any merge.
