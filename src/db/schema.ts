import type { ColumnType, Generated, Insertable, Selectable, Updateable } from "kysely";

export type Int8 = ColumnType<string, string | number | bigint, string | number | bigint>;
export type Numeric = ColumnType<string, string | number, string | number>;
export type Timestamp = ColumnType<Date, Date | string | undefined, Date | string>;

export type UserRole = "admin" | "foreman";
export type ObjectStatus = "active" | "archived";
export type ExpenseType = "manual_purchase" | "document_purchase" | "bank_transfer" | "service_payment";

export interface UsersTable {
  id: Generated<string>;
  telegram_id: Int8;
  role: UserRole;
  name: string;
  username: string | null;
  is_blocked: ColumnType<boolean, boolean | undefined, boolean>;
  created_at: Timestamp;
  updated_at: Timestamp;
  deleted_at: Timestamp | null;
}

export interface ObjectsTable {
  id: Generated<string>;
  title: string;
  status: ColumnType<ObjectStatus, ObjectStatus | undefined, ObjectStatus>;
  budget_amount: ColumnType<string, string | number | bigint | undefined, string | number | bigint>;
  created_at: Timestamp;
  updated_at: Timestamp;
  archived_at: Timestamp | null;
}

export interface ObjectForemenTable {
  id: Generated<string>;
  object_id: Int8;
  foreman_id: Int8;
  created_at: Timestamp;
  deleted_at: Timestamp | null;
}

export interface ExpensesTable {
  id: Generated<string>;
  object_id: Int8;
  author_id: Int8;
  type: ExpenseType;
  title: string;
  amount: Int8;
  quantity: Numeric | null;
  unit: string | null;
  unit_price: Int8 | null;
  document_photo_file_id: string | null;
  comment: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
  deleted_at: Timestamp | null;
}

export interface Database {
  users: UsersTable;
  objects: ObjectsTable;
  object_foremen: ObjectForemenTable;
  expenses: ExpensesTable;
}

export type User = Selectable<UsersTable>;
export type NewUser = Insertable<UsersTable>;
export type UserUpdate = Updateable<UsersTable>;

export type ConstructionObject = Selectable<ObjectsTable>;
export type NewConstructionObject = Insertable<ObjectsTable>;
export type ConstructionObjectUpdate = Updateable<ObjectsTable>;

export type ObjectForeman = Selectable<ObjectForemenTable>;
export type NewObjectForeman = Insertable<ObjectForemenTable>;

export type Expense = Selectable<ExpensesTable>;
export type NewExpense = Insertable<ExpensesTable>;
export type ExpenseUpdate = Updateable<ExpensesTable>;
