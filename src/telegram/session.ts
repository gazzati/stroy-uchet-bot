import type { Context, SessionFlavor } from "grammy";
import type { ExpenseType, User } from "../db/schema.js";

// --- Wizard flow state (stored in session) ---

export type CreateObjectFlow = {
  kind: "create_object";
  step: "title" | "budget";
  title?: string;
};

export type CreateForemanFlow = {
  kind: "create_foreman";
  step: "telegram_id" | "name";
  telegramId?: string;
};

export type RenameObjectFlow = {
  kind: "rename_object";
  objectId: string;
};

export type ObjectBudgetFlow = {
  kind: "object_budget";
  objectId: string;
};

export type RenameForemanFlow = {
  kind: "rename_foreman";
  foremanId: string;
};

export type ForemanApplicationFlow = {
  kind: "foreman_application";
  step: "name";
};

export type ExpenseDraft = {
  title?: string;
  quantity?: string;
  unit?: string;
  unitPriceKopecks?: string;
  amountKopecks?: string;
  documentPhotoFileId?: string | null;
  comment?: string | null;
};

export type ExpenseStep =
  | "title"
  | "quantity"
  | "unit"
  | "unit_price"
  | "photo"
  | "amount"
  | "comment"
  | "confirm";

export type AddExpenseFlow = {
  kind: "add_expense";
  objectId: string;
  type: ExpenseType;
  step: ExpenseStep;
  draft: ExpenseDraft;
};

export type EditExpenseFlow = {
  kind: "edit_expense";
  expenseId: string;
  objectId: string;
  type: ExpenseType;
  step: ExpenseStep;
  draft: ExpenseDraft;
};

export type Flow =
  | CreateObjectFlow
  | CreateForemanFlow
  | ForemanApplicationFlow
  | RenameObjectFlow
  | ObjectBudgetFlow
  | RenameForemanFlow
  | AddExpenseFlow
  | EditExpenseFlow;

export type SessionData = {
  flow: Flow | null;
  /** message_id of the last wizard prompt, so it can be removed when the flow is abandoned. */
  promptMessageId?: number;
};

export function initialSession(): SessionData {
  return { flow: null };
}

export type AuthedContext = Context &
  SessionFlavor<SessionData> & {
    user?: User;
  };
