# DM Workspace

Веб-приложение (VTT) для D&D 5.24 (2024) — мастерская ГМа и игроков. Создавай кампании, веди главы, управляй сценами, токенами, музыкой и хендаутами. Всё в одном месте.

Production: https://dm-workspace.vercel.app

## 📚 Документация

| Документ | Назначение |
| --- | --- |
| [docs/README.md](docs/README.md) | Оглавление всей документации |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Дорожная карта: выполнено / в работе / запланировано |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Архитектура, схемы, данные, тестовый контур |
| [docs/ENGINEERING_PROCESS.md](docs/ENGINEERING_PROCESS.md) | Ветки, критерии слияния, релиз, синхронизация Miro |
| [docs/TECHNICAL_IMPROVEMENTS.md](docs/TECHNICAL_IMPROVEMENTS.md) | Технический долг и предложения |

## ✨ Возможности

- **Публичный вход** — лендинг, офлайн-демо игрового стола, онбординг по приглашению.
- **Кампании и роли** — ГМ / игрок, приглашения по invite-code.
- **Кабинет ГМа** — главы (CodeMirror + wikilinks), сущности, связи, теги, шаблоны, иерархия локаций, генераторы.
- **Лист персонажа** — wizard, класс/подкласс SRD, характеристики, навыки, HP, death saves, заклинания, инвентарь, level-up.
- **Тактическая карта** — сцены, загрузка карт, токены, таймлайн инициативы, поиск участников, области заклинаний, маршруты, туман войны, стены, Realtime.
- **Сессии** — планирование, RSVP, экспорт в календарь, журнал, чат с дайс-роллером.
- **Мультимедиа** — музыка, приватные хендауты.
- **SRD 5.2** (Open5e) — бестиарий, заклинания, предметы, магические предметы.
- **Настройки** — профиль, безопасность, тема, удаление аккаунта.

## 🛠 Стек

- **Next.js 16** (App Router, `proxy.ts`) + **React 19** + **TypeScript** + **Tailwind CSS 4**
- **Supabase** (PostgreSQL, Auth, RLS, Realtime Broadcast, Storage)
- **CodeMirror 6**, **@dnd-kit**, **zustand**, **lucide-react**
- **Playwright** + `node --test` — тесты; **GitHub Actions** — CI; **Vercel** — хостинг

## 🚀 Быстрый старт

### 1. Клонируй репозиторий

```bash
git clone https://github.com/DoctorStrangeSH/dm-workspace.git
cd dm-workspace
```

### 2. Установи зависимости

```bash
npm install
```

### 3. Настрой окружение

Создай `.env.local` в корне:

```env
# Supabase (DEV-проект!)
NEXT_PUBLIC_SUPABASE_URL=https://[dev-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[dev-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[dev-service-role-key]

# Sentry (опционально)
# SENTRY_DSN=https://...
```

⚠️ Для локальной разработки используй DEV-проект Supabase, не PROD. Seed-скрипт (`npm run seed:test`) откажется работать на PROD.

### 4. Примени схему БД

Hardening-миграции — в `supabase/migrations/`, применяются по порядку имени файла. Базовая схема пока хранится вне репозитория (см. [TD-01](docs/TECHNICAL_IMPROVEMENTS.md)).

### 5. Запусти dev-сервер

```bash
npm run dev
```

Открой http://localhost:3000.

## 📜 Скрипты

| Скрипт | Что делает |
| --- | --- |
| `npm run dev` | Dev-сервер (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Production-сервер (после build) |
| `npm run lint` / `lint:fix` | ESLint |
| `npm run format` / `format:check` | Prettier |
| `npm run test:characters` | Персонажи, HP, level-up |
| `npm run test:maps` | Геометрия карты, бой, маршруты, области |
| `npm run test:campaign-ui` | Офлайн UI кампании (Playwright) |
| `npm run test:production-layout` | Регрессия production CSS |
| `npm run test:public-landing` | Лендинг, граница авторизации, демо |
| `npm run test:security:pr37` | Статические проверки миграций безопасности |
| `npm run test:hp:harness` | Офлайн HP-харнесс (mock) |
| `npm run test:e2e:smoke` | Smoke E2E (нужен DEV Supabase) |
| `npm run test:e2e:screenshots` / `test:e2e:update` | Visual regression / обновление эталонов |
| `npm run seed:test` | Тестовые данные в DEV Supabase |

## 🧪 Тестирование

Полная матрица наборов и их статус в CI — [ARCHITECTURE.md §7](docs/ARCHITECTURE.md).

Smoke E2E и visual regression требуют DEV Supabase. Перед запуском выполни `npm run seed:test`: создаётся тестовый пользователь `test@dm-workspace.dev`, кампания «Test Campaign» с 2 главами, 3 сущностями, сценой и персонажем (учётные данные — в `scripts/seed-test-user.ts`).

## 📁 Структура

```text
src/
├── app/                # App Router: (auth), campaign/[id]/*, dashboard, join, settings, api
├── components/         # app-shell, landing, ui, toast, мобильная навигация
├── lib/
│   ├── actions/        # Server Actions — единственная точка записи
│   ├── queries/        # server-only чтение
│   ├── hooks/          # use-realtime-*, autosave, hotkeys, theme
│   ├── dnd/            # правила D&D: HP, level-up, классы, слоты
│   ├── maps/           # геометрия, инициатива, маршруты, области заклинаний
│   ├── srd/            # парсеры Open5e
│   └── supabase/       # client.ts, server.ts
└── proxy.ts            # Next.js 16 proxy (сессия и редиректы)

supabase/migrations/    # SQL-миграции
supabase/verification/  # SQL-проверки и фикстуры CI
scripts/                # seed-скрипты
tests/                  # unit, офлайн-браузерные, Playwright E2E
docs/                   # документация
```

## 🗄 Схема БД (Supabase)

| Таблица | Назначение |
| --- | --- |
| `profiles` | username, display_name, avatar_url |
| `campaigns` | name, genre, owner_id, invite_code |
| `campaign_members` | campaign_id, user_id, role (dm/player) |
| `chapters` | campaign_id, title, content_md, order_index |
| `entities` / `entity_relations` | сущности и связи |
| `characters` | campaign_id, user_id, name, data_json |
| `scenes` | campaign_id, name, grid_size, width, height |
| `tokens` | scene_id, name, x, y, hp_current, hp_max |
| `initiative` | scene_id, token_id, initiative, turn_order |
| `fog_areas` | туман войны |
| `playlists` / `tracks` | музыка |
| `handouts` | хендауты |
| `session_logs` | логи сессий |
| `messages` | чат |
| `srd_*` | кэш SRD (Open5e) |

Диаграмма связей — [ARCHITECTURE.md §4](docs/ARCHITECTURE.md).

## 🔐 RLS и безопасность

- Все таблицы — под RLS; helper-функции `is_campaign_dm(campaign_id)`, `user_campaign_ids()`.
- Подзапросы к RLS-таблицам — только через `security definer` функции.
- Каналы Realtime авторизуются по членству в кампании (миграция `20261027000100`).
- Хендауты, музыка и карты сцен — в приватных бакетах Storage, выдаются через `app/api/*`.
- `replica identity full` для `tokens`, `initiative`.

## 📡 Realtime

Broadcast (не `postgres_changes`) для tokens, initiative, fog, walls, summons, messages, handouts, music, chapters. Триггеры — `realtime.broadcast_changes()`, клиентские хуки — `use-realtime-*`.

## 🚀 Деплой

Vercel подключён к GitHub: каждый PR получает Preview, слияние в `main` выпускает Production. Порядок релиза и отката — [ENGINEERING_PROCESS.md](docs/ENGINEERING_PROCESS.md).

Переменные окружения Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. Для Preview используй DEV-проект Supabase.

## 🗺 Дорожная карта

Актуальная дорожная карта с приоритетами и зависимостями — [docs/ROADMAP.md](docs/ROADMAP.md).

## 📝 Лицензия

Private project. All rights reserved. Материалы SRD — см. `/srd-license`.

## 🤝 Контакты

GitHub: [@DoctorStrangeSH](https://github.com/DoctorStrangeSH)
