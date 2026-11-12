# Документация DM Workspace

Начинать с [ROADMAP](ROADMAP.md) и [ARCHITECTURE](ARCHITECTURE.md).

## Управление проектом

| Документ | Тема |
| --- | --- |
| [ROADMAP.md](ROADMAP.md) | Дорожная карта DM Workspace |
| [ENGINEERING_PROCESS.md](ENGINEERING_PROCESS.md) | Процесс разработки и релиза |
| [TECHNICAL_IMPROVEMENTS.md](TECHNICAL_IMPROVEMENTS.md) | Технический долг и предложения по улучшению |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Архитектура DM Workspace |

## Функциональные спецификации

| Документ | Тема |
| --- | --- |
| [BESTIARY_CATALOG_DISPLAY.md](BESTIARY_CATALOG_DISPLAY.md) | Bestiary cards and mobile details |
| [CAMPAIGN_CARDS_DISPLAY.md](CAMPAIGN_CARDS_DISPLAY.md) | Campaign cards and confirmations |
| [CAMPAIGN_OVERVIEW_AND_EDITOR_UX.md](CAMPAIGN_OVERVIEW_AND_EDITOR_UX.md) | Campaign overview and chapter editor - 2026-10-29 |
| [CAMPAIGN_WORKSPACE_UX.md](CAMPAIGN_WORKSPACE_UX.md) | Campaign workspace UX and localization — 2026-10-29 |
| [CHARACTER_CLASS_CHANGE_UX.md](CHARACTER_CLASS_CHANGE_UX.md) | Character class-change review — 2026-10-29 |
| [CHARACTER_LIBRARY_UX.md](CHARACTER_LIBRARY_UX.md) | Character inventory and spellbook — 2026-10-30 |
| [COMBAT_PARTICIPANT_FINDER.md](COMBAT_PARTICIPANT_FINDER.md) | Combat participant finder |
| [CHAT_DICE_WORKBENCH.md](CHAT_DICE_WORKBENCH.md) | Панель кубиков, преимущество и помеха в чате |
| [GM_GENERATOR_WORKBENCH.md](GM_GENERATOR_WORKBENCH.md) | Мастерская ведущего и сохранение результатов генераторов |
| [INITIATIVE_SYNC.md](INITIATIVE_SYNC.md) | Initiative refresh synchronization |
| [INVITATION_ONBOARDING.md](INVITATION_ONBOARDING.md) | Invitation and first-campaign onboarding |
| [ITEM_CATALOG_DISPLAY.md](ITEM_CATALOG_DISPLAY.md) | Item catalog labels and card readability |
| [ITEM_CATALOG_SEARCH.md](ITEM_CATALOG_SEARCH.md) | Item catalog search and browsing |
| [MAGIC_ITEM_CATALOG_IMPORT.md](MAGIC_ITEM_CATALOG_IMPORT.md) | Magic item catalog import |
| [MAP_COMBAT_SYNC_FIX.md](MAP_COMBAT_SYNC_FIX.md) | Combat drawer, zoom and token synchronization |
| [MAP_ROUTE_PLANNER.md](MAP_ROUTE_PLANNER.md) | Map route planner |
| [PRODUCTION_MAP_LAYOUT.md](PRODUCTION_MAP_LAYOUT.md) | Production map layout regression |
| [PUBLIC_LANDING_DEMO.md](PUBLIC_LANDING_DEMO.md) | Public introduction and practice table |
| [SESSION_CARDS_DISPLAY.md](SESSION_CARDS_DISPLAY.md) | Session cards and mobile controls |
| [SESSION_PLANNING_HUB.md](SESSION_PLANNING_HUB.md) | Session planning hub |
| [SESSION_RSVP_SELECTION.md](SESSION_RSVP_SELECTION.md) | Saved personal session response |
| [SPELL_AREA_WORKBENCH.md](SPELL_AREA_WORKBENCH.md) | Spell area workbench |
| [SPELL_BESTIARY_SEARCH.md](SPELL_BESTIARY_SEARCH.md) | Spell and bestiary catalog search |
| [SPELL_CATALOG_DISPLAY.md](SPELL_CATALOG_DISPLAY.md) | Spell catalog card readability |
| [SRD_INVENTORY_IMPORT.md](SRD_INVENTORY_IMPORT.md) | SRD item import metadata — 2026-10-30 |
| [TACTICAL_MAP_WORKSPACE.md](TACTICAL_MAP_WORKSPACE.md) | Tactical map workspace |
| [VISUAL_TURN_TIMELINE.md](VISUAL_TURN_TIMELINE.md) | Visual turn timeline |

## Целостность HP и данных персонажа

| Документ | Тема |
| --- | --- |
| [CHARACTER_HP_VALIDATION.md](CHARACTER_HP_VALIDATION.md) | Character HP and level-up validation — 2026-10-29 |
| [HP_ATOMIC_ROLLOUT_CONTRACT.md](HP_ATOMIC_ROLLOUT_CONTRACT.md) | Atomic HP rollout contract |
| [HP_DEV_METADATA_RECONCILIATION.md](HP_DEV_METADATA_RECONCILIATION.md) | HP DEV metadata reconciliation — 2026-10-28 |
| [HP_DEV_RECONCILIATION_PLAN.md](HP_DEV_RECONCILIATION_PLAN.md) | HP DEV reconciliation — review plan, not a migration |
| [HP_INTEGRATION_CHECKPOINT.md](HP_INTEGRATION_CHECKPOINT.md) | HP evidence integration — 2026-10-28 |
| [HP_LOCAL_POSTGRES_BASELINE.md](HP_LOCAL_POSTGRES_BASELINE.md) | Local PostgreSQL HP baseline — 2026-10-28 |
| [HP_SAFE_HARNESS.md](HP_SAFE_HARNESS.md) | Disposable DEV HP harness — preparation only |
| [HP_WRITE_PATH_AUDIT.md](HP_WRITE_PATH_AUDIT.md) | HP write-path audit — current main |
| [character-identity-rpc-dev-verification.md](character-identity-rpc-dev-verification.md) | Atomic character identity RPC — DEV acceptance gate |
| [legacy-character-writer-concurrency-audit.md](legacy-character-writer-concurrency-audit.md) | Legacy character JSON writers — concurrency audit |

## Журнал передачи работ и триаж

| Документ | Тема |
| --- | --- |
| [AI_HANDOFF_CURRENT.md](AI_HANDOFF_CURRENT.md) | DM Workspace — current AI handoff (2026-10-29) |
| [AI_PROJECT_AUTHORIZATION.md](AI_PROJECT_AUTHORIZATION.md) | Project authorization — human update, 2026-10-28 |
| [PR_BACKLOG_TRIAGE_2026-10-28.md](PR_BACKLOG_TRIAGE_2026-10-28.md) | Old PR archive and preserved backlog — 2026-10-28 |

## Безопасность

| Документ | Тема |
| --- | --- |
| [security/PR37_DEV_RELEASE_AND_RECOVERY.md](security/PR37_DEV_RELEASE_AND_RECOVERY.md) | PR #37 — DEV-only release and recovery runbook |
| [security/PR37_FREE_TIER_PROD_BACKUP_GATE.md](security/PR37_FREE_TIER_PROD_BACKUP_GATE.md) | PR #37 — Free-tier PROD backup gate (2026-10-27) |
| [security/PR37_HANDOFF_FOR_NEXT_AI.md](security/PR37_HANDOFF_FOR_NEXT_AI.md) | HANDOFF — PR #37 Realtime + private Storage security |
| [security/pr-37-staging-test-matrix.md](security/pr-37-staging-test-matrix.md) | PR #37 staging test matrix |
| [security/realtime-storage-hardening-plan.md](security/realtime-storage-hardening-plan.md) | Realtime + Storage security rollout (DEV first) |

## Проверочные материалы

SQL-запросы и машиночитаемые результаты — каталог [verification/](verification/).
