# Adventure preparation workspace — 2026-11-13

Base main: `1c049cb3faf0fb01fddd27cda0bb0a1b17d6b91e`.
Branch: `feat/adventure-preparation-workspace`. Feature writes only; never push main.

Reviewed wide character wizard/live preview, class-specific score suggestions, backward
navigation/focus, unique skill validation, explicit errors and uncertain-creation lock.
New higher-level characters use average HP growth; existing characters are not rewritten.
SRD known class primary ability now comes from base class metadata. Class features,
equipment and ability improvements are not automatically granted by selecting a level.

Scenes support local scopes/search/sort, complete names and touch actions. Existing
activate/delete actions retain authorization, with local duplicate guards and inline
failure feedback. Map and scene pages use available width; combat/movement logic stays
on existing paths. Chapter starters prefill only titles and require explicit submission.
Chapter creation uses the shared accessible dialog and existing action.

Completed before PR: TypeScript PASS; 59 character/boundary/module tests PASS;
15 focused browser scenarios plus 2 visual captures PASS; full ESLint 0 errors and
one pre-existing realtime cleanup warning. RU dark desktop and RU light 320px scenes,
hero preview and RU dark chapter starter screenshots inspected.

Full campaign suite initially passed 211/212; one old test inspected navigation while
the synthetic creation request was still resolving. Default mock delay is restored to
immediate and navigation assertions await the completed transition. Full rerun is in
progress; final CI and release evidence must be recorded separately before completion.
An earlier temporary runner also tried to append tests after browser shutdown; it was
discarded. All temporary runners have been deleted. These were harness issues.

No server actions/schema/migrations/installed HP RPC/manual workflow/live database writes.
No authenticated campaign acceptance: current environment lacks a signed-in session and
direct production requests timed out on the prior release. Source and CI success do not
establish live authorized saves. Preserve these limits in the release receipt.
