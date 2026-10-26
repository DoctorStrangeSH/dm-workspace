# AI developer handoff

Repository: `DoctorStrangeSH/dm-workspace` (Next.js 16, React 19, Supabase, Playwright, Vercel).

## Start here
1. Read `AGENTS.md`, `README.md`, this document and `docs/DEVELOPMENT_STATUS.md`.
2. Inspect open GitHub PRs, their base/head branches, CI conclusions and Vercel comments. Draft does **not** mean tested or merged.
3. Check relevant source files and existing tests before code changes. Follow `AGENTS.md` Next.js version-specific guidance.
4. Work in an isolated branch and open a descriptive Draft PR. Avoid silently changing `main`.

## Current context
- Combined design PR #51 stacks #45–#50.
- Test PR #52 targets #51; HP display fix PR #53 targets #52.
- User reported malformed character HP display (`D101` and `null`). Runtime type guards were added; subsequent write validation is in progress.
- Keep player/DM role restrictions, RU/EN copy, accessibility and light/dark themes.
- Confirm Preview uses isolated DEV Supabase before any state-changing tests.

## What good PR descriptions need
Purpose, bug reproduction, changed files/behavior, risks, dependency/base branch, CI status, manual QA checklist and precise outstanding work. Update the development status when milestones change.
