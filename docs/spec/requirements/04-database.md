# 04. Предварительная схема базы данных

Схема описывает целевую структуру MVP. Названия таблиц и полей можно уточнить при выборе ORM и миграционного инструмента.

## `users`

Пользователи Telegram-бота.

| Поле | Тип | Ограничения | Описание |
| --- | --- | --- | --- |
| `id` | bigint | PK | Внутренний ID |
| `telegram_id` | bigint | unique, not null | Telegram ID |
| `role` | text | not null | `admin` или `foreman` |
| `name` | text | not null | Отображаемое имя |
| `username` | text | nullable | Telegram username |
| `is_blocked` | boolean | not null, default false | Блокировка доступа |
| `created_at` | timestamptz | not null | Дата создания |
| `updated_at` | timestamptz | not null | Дата обновления |
| `deleted_at` | timestamptz | nullable | Мягкое удаление |

Индексы:

- unique index по `telegram_id`, если `deleted_at is null`;
- index по `role`;
- index по `is_blocked`.

## `objects`

Строительные объекты.

| Поле | Тип | Ограничения | Описание |
| --- | --- | --- | --- |
| `id` | bigint | PK | ID объекта |
| `title` | text | not null | Название |
| `status` | text | not null | `active` или `archived` |
| `budget_amount` | bigint | not null, default 0 | Бюджет в копейках |
| `created_at` | timestamptz | not null | Дата создания |
| `updated_at` | timestamptz | not null | Дата обновления |
| `archived_at` | timestamptz | nullable | Дата архивации |

Индексы:

- index по `status`;
- index по `archived_at`.

## `object_foremen`

Назначения бригадиров на объекты.

| Поле | Тип | Ограничения | Описание |
| --- | --- | --- | --- |
| `id` | bigint | PK | ID назначения |
| `object_id` | bigint | FK `objects.id`, not null | Объект |
| `foreman_id` | bigint | FK `users.id`, not null | Бригадир |
| `created_at` | timestamptz | not null | Дата назначения |
| `deleted_at` | timestamptz | nullable | Дата открепления |

Индексы:

- index по `object_id`;
- index по `foreman_id`;
- unique index по `object_id`, `foreman_id`, если `deleted_at is null`.

## `expenses`

Расходы.

| Поле | Тип | Ограничения | Описание |
| --- | --- | --- | --- |
| `id` | bigint | PK | ID расхода |
| `object_id` | bigint | FK `objects.id`, not null | Объект |
| `author_id` | bigint | FK `users.id`, not null | Автор |
| `type` | text | not null | Тип расхода |
| `title` | text | not null | Наименование |
| `amount` | bigint | not null | Сумма в копейках |
| `quantity` | numeric(12, 3) | nullable | Количество |
| `unit` | text | nullable | Единица измерения |
| `unit_price` | bigint | nullable | Цена за единицу в копейках |
| `document_photo_file_id` | text | nullable | Telegram `file_id` фото документа |
| `comment` | text | nullable | Комментарий |
| `created_at` | timestamptz | not null | Дата создания |
| `updated_at` | timestamptz | not null | Дата обновления |
| `deleted_at` | timestamptz | nullable | Мягкое удаление |

Индексы:

- index по `object_id`;
- index по `author_id`;
- index по `type`;
- index по `created_at`;
- index по `deleted_at`;
- composite index по `object_id`, `created_at`.

## Проверочные ограничения

Предварительные ограничения:

- `users.role in ('admin', 'foreman')`;
- `objects.status in ('active', 'archived')`;
- `objects.budget_amount >= 0`;
- `expenses.type in ('manual_purchase', 'document_purchase', 'bank_transfer', 'service_payment')`;
- `expenses.amount > 0`;
- для `manual_purchase`: `quantity is not null`, `unit is not null`, `unit_price is not null`, `document_photo_file_id is null`;
- для `document_purchase`: `quantity is null`, `unit is null`, `unit_price is null`, `document_photo_file_id` может быть заполнен;
- для `bank_transfer`: `quantity is null`, `unit is null`, `unit_price is null`, `document_photo_file_id is null`;
- для `service_payment`: `quantity is null`, `unit is null`, `unit_price is null`, `document_photo_file_id is null`.

## Фото документов

В MVP фото документов не скачиваются в отдельное файловое хранилище.

Правила:

- в таблице `expenses` хранится только Telegram `file_id`;
- `file_unique_id` не хранится;
- просмотр фото выполняется через повторную отправку фото ботом в Telegram-чат;
- для веб-панели или независимого хранения документов после MVP можно добавить S3-совместимое хранилище.

## Денежные значения

Все денежные значения хранятся в целых копейках:

- `objects.budget_amount`;
- `expenses.amount`;
- `expenses.unit_price`.

Валюта MVP - рубли. Отдельное поле валюты в MVP не требуется.

Для ручной закупки сумма рассчитывается как `round(quantity * unit_price)`, где `unit_price` задан в копейках. Результат записывается в `expenses.amount` как целое число копеек.

## Расчетные запросы

Сумма расходов объекта:

```sql
select coalesce(sum(amount), 0) as total_expenses
from expenses
where object_id = :object_id
  and deleted_at is null;
```

Остаток бюджета:

```sql
select
  o.budget_amount,
  coalesce(sum(e.amount), 0) as total_expenses,
  o.budget_amount - coalesce(sum(e.amount), 0) as balance
from objects o
left join expenses e
  on e.object_id = o.id
 and e.deleted_at is null
where o.id = :object_id
group by o.id;
```
