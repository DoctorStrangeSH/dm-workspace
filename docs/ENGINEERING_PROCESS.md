# Процесс разработки и релиза

## 1. Источник истины

- GitHub (`DoctorStrangeSH/dm-workspace`) — единственный источник истины для кода, схемы БД и технической документации.
- Доска Miro — визуальное отражение `docs/ROADMAP.md`; самостоятельно задачи там не создаются.
- Vercel разворачивает только то, что есть в Git.

## 2. Ветки

| Префикс | Назначение |
| --- | --- |
| `feat/` | новая функциональность |
| `fix/` | исправление дефекта |
| `security/` | RLS, гранты, Storage, авторизация |
| `docs/` | документация |
| `test/` | тесты и харнессы |
| `ci/` | конвейер |

Прямые коммиты в `main` запрещены. Архивные ветки (закрытые без слияния PR) не удаляются — в них сохранены требования бэклога (`PR_BACKLOG_TRIAGE_2026-10-28.md`).

## 3. Pull Request: критерии слияния

1. CI зелёный на финальном head SHA: `Lint, typecheck, and build` и `PR #37 isolated PostgreSQL RLS tests`.
2. Vercel Preview в статусе READY, ключевой сценарий изменения проверен вручную.
3. Изменение схемы БД — только миграцией в `supabase/migrations` + проверка в DEV + план отката.
4. Документация обновлена (функциональный документ в `docs/`, при необходимости `ROADMAP.md`).
5. Слияние по ожидаемому head SHA (защита от гонки с новым push).

## 4. Релиз в Production

Слияние в `main` автоматически запускает Production-деплой Vercel. После слияния:

1. Дождаться CI на `main` (push-событие).
2. Проверить статус Vercel на коммите (`GET /repos/{repo}/commits/{sha}/status` → контекст `Vercel` = success).
3. Открыть `https://dm-workspace.vercel.app` и `/login`, убедиться в HTTP 200.
4. Зафиксировать результат в описании PR.

Откат: Vercel → Deployments → «Promote to Production» для предыдущего READY-деплоя; затем revert-PR в GitHub.

## 5. Окружения

| Окружение | Приложение | Supabase |
| --- | --- | --- |
| Local | `npm run dev` | DEV-проект |
| Preview | Vercel Preview (каждый PR) | должен быть DEV (проверить, TD-04) |
| Production | `dm-workspace.vercel.app` | PROD |

Переменные: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (только сервер). Значения в репозиторий не попадают.

## 6. Синхронизация доски Miro

Выполняется после каждого релиза или изменения `ROADMAP.md`.

| Раздел доски | Источник |
| --- | --- |
| «Выполнено» | ROADMAP §2, влитые PR |
| «В работе» | ROADMAP §3, открытые PR и Issues |
| «Запланировано» | ROADMAP §4 по кварталам |
| «Архитектура» | ARCHITECTURE §1, §2, §6 |
| «Зависимости и приоритеты» | ROADMAP §5 |
| «Технический долг» | TECHNICAL_IMPROVEMENTS |

Карточка содержит ID, название, приоритет и ссылку на PR/Issue. Цвет: P0 — красный, P1 — оранжевый, P2 — синий, P3 — серый. Существующие материалы доски не удаляются — устаревшее переносится во фрейм «Архив».

## 7. Issues

Метки: `priority:P0…P3`, `type:feature|bug|security|debt|docs`, `area:vtt|characters|campaign|db|ci`. Issue закрывается PR-ом (`Closes #N`) или комментарием со ссылкой на подтверждающий PR.
