# Архитектура DM Workspace

Актуальность: 2026-11-07 · main `7e4fbeb`

## 1. Контекст системы

```mermaid
flowchart LR
  U[Мастер / Игрок<br/>браузер, мобильный] -->|HTTPS| V[Vercel<br/>Next.js 16 App Router]
  V -->|Server Actions, SSR<br/>anon key + JWT| S[(Supabase PostgreSQL<br/>RLS)]
  V -->|service role<br/>только сервер| SA[Supabase Auth Admin]
  U <-->|WebSocket Broadcast| R[Supabase Realtime]
  S -->|realtime.broadcast_changes| R
  V -->|подписанный доступ| ST[Supabase Storage<br/>приватные бакеты]
  O[Open5e / SRD 5.2] -.->|импорт скриптами| S
  GH[GitHub main] -->|Git-интеграция| V
  GH --> CI[GitHub Actions CI]
```

## 2. Слои приложения

```mermaid
flowchart TB
  subgraph Client[Клиент]
    P[Страницы app/*] --> C[components/*]
    C --> H[lib/hooks<br/>use-realtime-*, autosave, hotkeys]
    C --> Z[zustand-состояние]
  end
  subgraph Server[Сервер Next.js]
    PX[proxy.ts<br/>сессия, редиректы] --> P
    A[lib/actions<br/>28 модулей Server Actions] --> Q[lib/queries<br/>server-only чтение]
    A --> D[lib/dnd · lib/maps · lib/srd<br/>чистая доменная логика]
    API[app/api<br/>handouts · music · scenes map]
  end
  C -->|вызов| A
  H -->|подписка| RT[(Realtime)]
  A --> DB[(PostgreSQL + RLS + RPC)]
  Q --> DB
  API --> STG[(Storage)]
```

Принципы:

- **Запись только через Server Actions** (`src/lib/actions`). Каждое действие проверяет членство/роль, whitelist полей и результат запроса.
- **Доменная логика чистая** (`src/lib/dnd`, `src/lib/maps`) — без I/O, покрыта unit-тестами `node --test`.
- **RLS — последняя линия защиты.** Проверки в коде не заменяют политики; подзапросы к RLS-таблицам — только через `security definer` функции (`is_campaign_dm`, `user_campaign_ids`).
- **Конкурентность:** JSON персонажа пишется через CAS (сравнение снимка), класс/подкласс — атомарным RPC.

## 3. Маршруты

| Зона | Маршруты | Доступ |
| --- | --- | --- |
| Публичная | `/`, `/login`, `/signup`, `/srd-license`, `/join/[code]` | все (redirect для авторизованных) |
| Кабинет | `/dashboard`, `/settings` | авторизованные |
| Кампания | `/campaign/[id]` + `chapters`, `entities`, `characters`, `scenes`, `session`, `sessions`, `bestiary`, `spells`, `items`, `generators` | участники; редактирование — ГМ |
| API | `/api/handouts/[id]/image`, `/api/music/tracks/[id]/audio`, `/api/scenes/[id]/map` | выдача приватных файлов после проверки доступа |

## 4. Данные

```mermaid
erDiagram
  profiles ||--o{ campaign_members : участвует
  campaigns ||--o{ campaign_members : включает
  campaigns ||--o{ chapters : содержит
  campaigns ||--o{ entities : содержит
  entities ||--o{ entity_relations : связи
  campaigns ||--o{ characters : содержит
  campaigns ||--o{ scenes : содержит
  scenes ||--o{ tokens : размещает
  scenes ||--o{ initiative : порядок
  scenes ||--o{ fog_areas : туман
  tokens }o--o| characters : связан
  campaigns ||--o{ handouts : раздаёт
  campaigns ||--o{ session_logs : журнал
  campaigns ||--o{ messages : чат
```

Миграции: `supabase/migrations` (15 файлов, с 2026-10-25). Базовая схема создана ранее через Dashboard и в Git отсутствует — технический долг TD-01.

## 5. Realtime

Broadcast-каналы (не `postgres_changes`) для: tokens, initiative, fog, walls, summons, token owners, messages, handouts, music, chapters. Триггеры вызывают `realtime.broadcast_changes()`; авторизация каналов — миграция `20261027000100`. При переподключении клиент сверяет снимок (initiative/tokens), устаревшие ответы отбрасываются.

## 6. Поставка

```mermaid
flowchart LR
  B[feature-ветка] --> PR[Pull Request]
  PR --> CI1[CI: тесты, lint, tsc, build<br/>PostgreSQL RLS]
  PR --> PV[Vercel Preview]
  CI1 & PV --> M[Merge в main<br/>по expected head SHA]
  M --> CI2[CI на main]
  M --> PROD[Vercel Production<br/>dm-workspace.vercel.app]
```

Наряду с Vercel на каждый push в main срабатывает встроенный workflow «pages build and deployment» (GitHub Pages). Он не обслуживает приложение — см. TD-07.

## 7. Тестовый контур

| Набор | Команда | В CI |
| --- | --- | --- |
| Безопасность миграций (статика) | `test:security:pr37` | да |
| PostgreSQL RLS/Storage/Realtime | job `postgres-security` | да |
| HP-харнесс (mock) | `test:hp:harness` | да |
| Персонажи, HP, level-up | `test:characters` | да |
| Карты и бой | `test:maps` | да |
| Каталоги | magic-item, item-filters, spell-bestiary | да |
| Офлайн UI кампании (Playwright) | `test:campaign-ui` | да |
| Production CSS layout | `test:production-layout` | да |
| Лендинг и демо | `test:public-landing` | да |
| HP baseline PostgreSQL | workflow `hp-local-postgres` | при изменении `tests/hp-postgres` |
| Smoke E2E с авторизацией | `test:e2e:smoke` | **нет** (нужен Supabase) |
| Visual regression | `test:e2e:screenshots` | **нет** |
| Lighthouse | `lighthouserc.json` | **нет** |
