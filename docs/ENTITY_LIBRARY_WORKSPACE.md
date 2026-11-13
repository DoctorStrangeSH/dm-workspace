# Campaign entity library

The entity list is now a searchable campaign library. Name and description search
matches every entered word, ignoring case, repeated whitespace and Russian е/ё.
All seven entity types have filters, including notes. Counts reflect search and
visibility before the selected type is applied, so changing type stays useful.
Recently updated and name ordering do not alter stored data. Reset restores the
complete library. Existing `?type=quest` and other type links initialize the view;
subsequent filters are local to this page and are not saved in the URL or browser.

DMs can combine visible/hidden filters and create directly in the chosen type.
The existing creation action, templates and permissions remain authoritative;
the creation form retains its draft when the action returns an error. Player
views have no creation or visibility controls. Hidden rows are excluded from the
server query and defensively from client counts and search. This UI safeguard
does not replace database RLS.

The server validates campaign access before reads, projects only card fields,
and sends backlink counts only for returned IDs. It reads ordered card pages
with an exact count, including when the API row cap is smaller than the requested
page. A failed page read goes to the existing retry boundary rather than showing
an empty or partial success. Offset paging is not a cross-request snapshot;
concurrent edits can change the result until refresh. Search is local after load.
There are no schema changes, migrations, live data writes or new RPCs in this
release. HP and multi-client combat work remains separate.

Four offline browser scenarios use the actual library and creation dialog with
synthetic action transport: combined filters/search/reset/sort; deep-linked
creation type and save-error draft; player exclusion; empty 320px creation flow.
Four actual page-module tests verify access gates, minimal field projection,
player predicates/template exclusion, row-cap pagination and error propagation.
RU desktop dark and EN mobile light screenshots are checked separately from
authenticated Production acceptance, which is not established by these tests.
