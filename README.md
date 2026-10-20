# DM Workspace

Веб-приложение (VTT) для D&D 5.24 (2024) — мастерская ГМа и игроков. Создавай кампании, веди главы, управляй сценами, токенами, музыкой и хендаутами. Всё в одном месте.

## ✨ Возможности

- **Кампании и роли** — ГМ / игрок, приглашения по invite-code.
- **Кабинет ГМа** — главы (CodeMirror + wikilinks), сущности, связи, теги, шаблоны, иерархия локаций, статистика.
- **Лист персонажа** — wizard, характеристики, навыки, HP, death saves, заклинания, инвентарь, level-up.
- **VTT** — сцены, карты, токены, боевая система, Realtime (Broadcast), туман войны, линейка, шаблоны.
- **Мультимедиа** — музыка, хендауты, логи сессий, чат с дайс-роллером.
- **SRD 2024** (Open5e) — бестиарий, заклинания, предметы.
- **Настройки** — профиль, безопасность, тема, удаление аккаунта.

## 🛠 Стек

- **Next.js 16** (App Router) + **TypeScript** + **Tailwind CSS 4**
- **Supabase** (PostgreSQL, Auth, RLS, Realtime, Storage)
- **CodeMirror 6** — редактор глав с wikilinks
- **@dnd-kit** — drag-and-drop (главы, токены)
- **lucide-react** — иконки
- **Playwright** — E2E + visual regression
- **Sentry** — мониторинг ошибок (отложен, см. Этап 6)

## 🚀 Быстрый старт

### 1. Клонируй репозиторий

```bash
git clone https://github.com/DoctorStrangeSH/dm-workspace.git
cd dm-workspace
2. Установи зависимости
bash
npm install
3. Настрой окружение
Создай .env.local в корне:

env
# Supabase (DEV-проект!)
NEXT_PUBLIC_SUPABASE_URL=https://[dev-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[dev-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[dev-service-role-key]

# Sentry (опционально, см. Этап 6)
# SENTRY_DSN=https://...
⚠️ Важно: для локальной разработки используй DEV-проект Supabase, не PROD. Seed-скрипт (npm run seed:test) откажется работать на PROD.

4. Примени схему БД
Все SQL-миграции — в supabase/ (если есть) или в истории Supabase Dashboard → SQL Editor. Примени их по порядку.

5. Запусти dev-сервер
bash
npm run dev
Открой http://localhost:3000.

📜 Скрипты
Скрипт	Что делает
npm run dev	Dev-сервер (Turbopack)
npm run build	Production build
npm run start	Production-сервер (после build)
npm run lint	ESLint (0 errors, 0 warnings)
npm run lint:fix	ESLint с автофиксом
npm run format	Prettier по всему проекту
npm run format:check	Проверка форматирования (для CI)
npm run test:e2e	Все Playwright-тесты
npm run test:e2e:smoke	Smoke-тесты (16 сценариев)
npm run test:e2e:screenshots	Visual regression (11 скриншотов)
npm run test:e2e:update	Обновить эталоны скриншотов
npm run seed:test	Создать тестовые данные в DEV Supabase
🧪 Тестирование
Smoke-тесты (16)
Покрывают: логин, дашборд, кампанию, главы, редактор, VTT, настройки. Работают на chromium (desktop) и Pixel 5 (mobile).

bash
npm run test:e2e:smoke
Visual regression (11)
Скриншоты ключевых страниц. Сравниваются с эталонами в tests/screenshots.spec.ts-snapshots/.

bash
npm run test:e2e:screenshots
Обновить эталоны (после намеренного изменения дизайна):

bash
npm run test:e2e:update
Перед тестами — seed
Если тестовых данных нет:

bash
npm run seed:test
Создаёт: пользователя test@dm-workspace.dev / test-password-123, кампанию «Test Campaign» с 2 главами, 3 сущностями, сценой, персонажем.

📁 Структура
text
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # login, signup
│   ├── campaign/[id]/     # кампания: chapters, entities, characters, scenes, ...
│   ├── dashboard/         # список кампаний
│   ├── settings/          # профиль, безопасность, тема
│   └── page.tsx           # редирект на /dashboard или /login
├── components/             # Toast, Breadcrumbs, EmptyState, Skeleton
├── lib/
│   ├── actions/           # Server Actions (только они могут импортить server-модули)
│   ├── queries/           # Server-only запросы к Supabase
│   ├── hooks/             # use-realtime-*, use-hotkey, use-theme, ...
│   ├── dnd/               # D&D-логика (формулы, level-up, SRD-adapter)
│   ├── srd/               # Open5e-парсеры
│   └── supabase/          # client.ts, server.ts
└── proxy.ts               # Next.js 16 proxy (замена middleware)

supabase/                  # SQL-миграции (если есть)
scripts/                   # seed-open5e.ts, seed-test-user.ts
tests/                     # Playwright: smoke, screenshots, helpers
🗄 Схема БД (Supabase)
Таблица	Назначение
profiles	username, display_name, avatar_url
campaigns	name, genre, owner_id, invite_code
campaign_members	campaign_id, user_id, role (dm/player)
chapters	campaign_id, title, content_md, order_index
entities	campaign_id, type, name, data_json
entity_relations	source_id, target_id, relation_type
characters	campaign_id, user_id, name, data_json
scenes	campaign_id, name, grid_size, width, height
tokens	scene_id, name, x, y, hp_current, hp_max
initiative	scene_id, token_id, initiative, turn_order
fog_areas	scene_id, x, y, width, height, is_revealed
playlists / tracks	музыка
handouts	хендауты
session_logs	логи сессий
messages	чат
srd_*	кэш SRD 2024 (Open5e)
🔐 RLS и безопасность
Все таблицы — под RLS.

Helper-функции: is_campaign_dm(campaign_id), user_campaign_ids().

Никогда не делай прямой подзапрос к таблице с RLS — только через security definer функцию.

replica identity full для tokens, initiative (Realtime UPDATE).

realtime.messages: using (true) для authenticated.

📡 Realtime
Используется Broadcast (не postgres_changes) для:

tokens, initiative, fog, messages, handouts, music, chapters.

Триггеры через realtime.broadcast_changes().

Хуки: use-realtime-*.

🚀 Деплой
Vercel
Подключи репозиторий к Vercel.

Добавь env-переменные (Settings → Environment Variables):

NEXT_PUBLIC_SUPABASE_URL (PROD)

NEXT_PUBLIC_SUPABASE_ANON_KEY (PROD)

SUPABASE_SERVICE_ROLE_KEY (PROD)

Deploy.

⚠️ Для Preview используй DEV-проект Supabase (чтобы превью не трогали PROD).

Supabase (PROD)
Примени SQL-миграции.

Настрой RLS-политики.

Настрой Auth (email confirmation, SMTP — см. Этап 6).

🗺 Дорожная карта
Этап	Статус
0 — Стабилизация фундамента	✅
1 — Дизайн-система	⬜
2 — Рефакторинг страниц	⬜
3 — A11y + производительность	⬜
4 — Паритет с конкурентами (генераторы, DM-панель, календарь)	⬜
5 — Превосходство (стены, призыв, Session Mode, AI)	⬜
6 — Экосистема (плагины, i18n, PWA, API)	⬜
7 — Полировка и бета-запуск	⬜
📝 Лицензия
Private project. All rights reserved.

🤝 Контакты
GitHub: @DoctorStrangeSH

Проект: dm-workspace

text

---

## 📄 Шаг 2 — `PROJECT_STATE.md`

Если у тебя есть `PROJECT_STATE.md` (из первого сообщения) — он **устарел**. Пришли его текущую версию — я дам **актуальный** с:
- Текущий прогресс (Этапы 0–7).
- Что сделано в Этапе 0 (0.1–0.7).
- Что дальше (Этап 1).
- Все критичные правила (Next.js 16, RLS, Realtime, UX).
- Структура БД (актуальная).
- Env-переменные (имена, без значений).
- Скрипты.

---

## 📋 Что делать

1. **Замени `README.md`** на версию выше.
2. **Пришли `PROJECT_STATE.md`** (текущий) — я дам актуальный.
3. **Закоммить README:**
   ```powershell
   git add README.md
   git commit -m "docs: replace default create-next-app README with project description"
   git push