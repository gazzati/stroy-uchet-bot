import { sql } from "kysely";
import { loadDatabaseConfig } from "../config/index.js";
import { createDb } from "./index.js";
import { logger } from "../utils/logger.js";

const migrationSql = `
create table if not exists users (
  id bigserial primary key,
  telegram_id bigint not null,
  role text not null check (role in ('admin', 'foreman')),
  name text not null,
  username text,
  is_blocked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index if not exists users_telegram_id_active_uidx
  on users (telegram_id)
  where deleted_at is null;
create index if not exists users_role_idx on users (role);
create index if not exists users_is_blocked_idx on users (is_blocked);

create table if not exists objects (
  id bigserial primary key,
  title text not null check (length(trim(title)) > 0),
  status text not null default 'active' check (status in ('active', 'archived')),
  budget_amount bigint not null default 0 check (budget_amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create index if not exists objects_status_idx on objects (status);
create index if not exists objects_archived_at_idx on objects (archived_at);

create table if not exists object_foremen (
  id bigserial primary key,
  object_id bigint not null references objects(id),
  foreman_id bigint not null references users(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists object_foremen_object_id_idx on object_foremen (object_id);
create index if not exists object_foremen_foreman_id_idx on object_foremen (foreman_id);
create unique index if not exists object_foremen_active_uidx
  on object_foremen (object_id, foreman_id)
  where deleted_at is null;

create table if not exists expenses (
  id bigserial primary key,
  object_id bigint not null references objects(id),
  author_id bigint not null references users(id),
  type text not null check (type in ('manual_purchase', 'document_purchase', 'bank_transfer', 'service_payment')),
  title text not null check (length(trim(title)) > 0),
  amount bigint not null check (amount > 0),
  quantity numeric(12, 3),
  unit text,
  unit_price bigint,
  document_photo_file_id text,
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint expenses_type_shape_chk check (
    (
      type = 'manual_purchase'
      and quantity is not null
      and unit is not null
      and unit_price is not null
      and document_photo_file_id is null
    )
    or (
      type = 'document_purchase'
      and quantity is null
      and unit is null
      and unit_price is null
    )
    or (
      type in ('bank_transfer', 'service_payment')
      and quantity is null
      and unit is null
      and unit_price is null
      and document_photo_file_id is null
    )
  )
);

create index if not exists expenses_object_id_idx on expenses (object_id);
create index if not exists expenses_author_id_idx on expenses (author_id);
create index if not exists expenses_type_idx on expenses (type);
create index if not exists expenses_created_at_idx on expenses (created_at);
create index if not exists expenses_deleted_at_idx on expenses (deleted_at);
create index if not exists expenses_object_created_at_idx on expenses (object_id, created_at);
`;

async function main() {
  const config = loadDatabaseConfig();
  const db = createDb(config.databaseUrl);

  try {
    await sql.raw(migrationSql).execute(db);
    logger.info("Database migration completed");
  } finally {
    await db.destroy();
  }
}

main().catch((error) => {
  logger.error({ err: error }, "Database migration failed");
  process.exitCode = 1;
});
