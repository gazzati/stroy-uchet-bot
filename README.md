# СтройУчет Бот

Закрытый Telegram-бот для учета расходов по строительным объектам.

Проект находится на этапе реализации MVP. Техническое задание и approved-спецификация лежат в `docs/spec`.

## Назначение

Сервис должен помогать:

- вести список строительных объектов;
- назначать бригадиров на объекты;
- фиксировать расходы по объектам;
- контролировать бюджет, сумму расходов и остаток;
- формировать отчеты;
- выгружать данные в CSV.

## Стек

- Node.js + TypeScript;
- интерфейс: Telegram Bot API;
- база данных: PostgreSQL;
- хранение фото документов: Telegram `file_id`;
- валюта: рубли;
- денежные значения: целые копейки;
- деплой: Docker Compose + GitHub Actions.

## Локальный запуск

Установить зависимости:

```bash
yarn install --immutable
```

Создать env-файл:

```bash
cp .env.example .env
```

Поднять PostgreSQL (любым удобным способом — локальный сервер или отдельный
контейнер) и прописать его в `DATABASE_URL` в `.env`. Например:

```bash
docker run -d --name stroy-uchet-pg -p 5432:5432 \
  -e POSTGRES_DB=stroy_uchet_bot -e POSTGRES_PASSWORD=postgres \
  postgres:16-alpine
```

Применить миграции:

```bash
yarn db:migrate
```

Запустить бота в dev-режиме:

```bash
yarn dev
```

## Проверки

```bash
yarn type
yarn test
yarn build
yarn npm audit
```

## Docker

Собрать image локально:

```bash
docker build -t gazzati/stroy-uchet-bot:latest .
```

Запустить через compose:

```bash
docker compose --env-file .env up -d
```

## Документация

- [Исходное ТЗ](docs/spec/StroyUchet_Bot_Full_TZ.docx)
- [Инженерная спецификация](docs/spec/specification.md)
- [Техническая архитектура](docs/spec/requirements/09-architecture.md)
- [Принятые решения](docs/spec/requirements/08-decisions.md)

## Статус

Создан базовый TypeScript-каркас: конфигурация, миграции БД, сервисы пользователей/объектов/расходов, CSV-отчеты и командный Telegram MVP.
