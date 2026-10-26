# D&D Workspace — project vision

A polished, mobile-friendly workspace for tabletop D&D campaigns, for dungeon masters and players.

## Pillars
- Cohesive fantasy-inspired UI; accessible on desktop and mobile, in light/dark mode and RU/EN.
- Campaign overview, chapters, character sheets, bestiary, scenes and interactive VTT.
- Reliable D&D mechanics: HP, initiative, dice, spells, combat and character progression.
- Secure campaign membership, owner/DM/player permission boundaries.

## Development principles
- Maintain small, reviewable pull requests with descriptive summaries and QA.
- Use separate Vercel Previews for manual testing.
- Never treat a Preview URL alone as proof of DEV Supabase isolation.
- Do not merge to `main`, change production data, or run migrations/destructive mutations without a deliberate release decision.
- Validate persisted JSON and server-action input at runtime, not only with TypeScript.

## Direction
Finish integrated UI QA, repair character data validation, then focus on VTT usability and game mechanics.
