# Performance Review

Система мониторинга развития технических навыков команды (Кейс 4 «Я хочу
развиваться»): годовое планирование обучения, протоколы PR-встреч (1:1),
древовидная структура подразделений с правами, зависящими от положения в
дереве, аналитика по прогрессу и уведомления в мессенджер MAX.

- **Frontend** — `action_group/`: Vue 3 + TypeScript + Vite + Pinia, иконки
  [`@lucide/vue`](https://lucide.dev). Подробности: `action_group/README.md`.
- **Backend** — `backend/`: FastAPI + SQLAlchemy (async) + PostgreSQL, JWT-аутентификация.
- **Docker** — `docker-compose.yml` поднимает всё целиком: Postgres, backend,
  и nginx с собранным фронтендом (`/api/*` проксируется на backend same-origin).

## Быстрый старт (Docker)

```sh
cp .env.example .env   # по умолчанию всё уже работает, редактировать не обязательно
docker compose up --build
```

- Фронтенд: http://localhost:8080
- API напрямую (Swagger): http://localhost:8000/docs

При первом запуске backend сам создаёт таблицы и засеивает демо-компанию —
дерево подразделений, справочник навыков, годовые планы, пара протоколов
встреч. Данные (Postgres) переживают перезапуск контейнеров в volume `pgdata`.

## Демо-доступ

| Логин       | Пароль    | Роль в дереве                                              |
|-------------|-----------|--------------------------------------------------------------|
| `admin`     | `admin`   | Администратор системы (видит всё)                            |
| `ceo`       | `ceo123`  | Руководитель компании                                         |
| `cto`       | `cto123`  | Руководитель «Разработки» **и** подчинённый CEO в его PR       |
| `back.lead` | `lead123` | Тимлид Backend, подчинённый CTO                                |
| `front.lead`| `lead123` | Тимлид Frontend                                                |
| `qa.lead`   | `lead123` | Тимлид QA                                                      |
| `a.volkov`  | `pass123` | Разработчик без подчинённых (видит только свой профиль)        |

Права нигде не хранятся как фиксированная роль пользователя — они каждый раз
вычисляются относительно открытого профиля (`action_group/src/composables/usePermissions.ts`
на фронте, `backend/app/permissions.py` на бэкенде — проверка реальная, не
только в интерфейсе): администратору доступно всё; руководителю
подразделения — все сотрудники в его поддереве дерева; остальным — только
свой профиль. Один и тот же человек (например, CTO) может одновременно
вести PR своих подчинённых и быть подчинённым в PR у вышестоящего
руководителя.

## Уведомления в MAX

Опциональная интеграция с ботом [MAX](https://dev.max.ru): напоминание о
приближающейся плановой дате подтверждения навыка (раз в сутки, за
`MAX_REMINDER_DAYS_AHEAD` дней) и уведомление сотруднику после каждой
зафиксированной PR-встречи. Каждый пользователь сам привязывает свой chat id
в MAX на главном экране (карточка «Уведомления в MAX») и может отправить
тестовое сообщение.

Чтобы включить: создайте бота в MAX, получите токен и укажите его в `.env`:

```
MAX_BOT_TOKEN=<токен бота>
```

Без токена приложение работает как обычно — все вызовы уведомлений просто
становятся no-op (проверяется в `backend/app/max_notify.py`).

## Запуск без Docker (для разработки)

```sh
# backend
cd backend
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
# нужен PostgreSQL с базой из DATABASE_URL (см. app/config.py)
.venv/bin/uvicorn app.main:app --reload --port 8000

# frontend (в отдельном терминале)
cd action_group
npm install
npm run dev   # проксирует /api на localhost:8000, см. vite.config.ts
```

## Структура репозитория

```
action_group/     Vue-фронтенд (Dockerfile + nginx.conf — прод-сборка за nginx)
backend/           FastAPI-бэкенд (Dockerfile)
docker-compose.yml  db + backend + frontend
.env.example        переменные окружения со значениями по умолчанию
```

## Переменные окружения (`.env`, см. `.env.example`)

| Переменная | Назначение | По умолчанию |
|---|---|---|
| `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD` | база данных | `performance_review` / `app` / `app` |
| `JWT_SECRET` | подпись токенов сессии | `change-me-in-production` |
| `CORS_ORIGINS` | источники, которым разрешено дёргать API напрямую (не через nginx-прокси) | `http://localhost:8080` |
| `MAX_BOT_TOKEN` | токен бота MAX; пусто = уведомления выключены | — |
| `MAX_API_BASE_URL` | домен Bot API MAX | `https://platform-api2.max.ru` |
| `MAX_REMINDER_DAYS_AHEAD` | за сколько дней напоминать о плановой дате | `3` |
