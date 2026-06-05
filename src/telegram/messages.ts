import type { ConstructionObject, Expense, User } from "../db/schema.js";
import type { ObjectWithBudget } from "../services/objects.js";
import type { ExpenseDraft } from "./session.js";
import { formatMoney } from "../utils/money.js";
import { translateExpenseType } from "../reports/reports.js";
import { EXPENSE_TYPE_LABELS } from "./callbacks/actions.js";
import type { ExpenseType } from "../db/schema.js";

export const ACCESS_DENIED_MESSAGE = "Доступ запрещён. Ваш аккаунт не зарегистрирован в системе.";

export function mainMenuTitle(user: User): string {
  return user.role === "admin" ? "Главное меню администратора" : "Главное меню бригадира";
}

export function objectLine(object: ObjectWithBudget): string {
  return [
    `🏗 ${object.title}`,
    `Бюджет: ${formatMoney(object.budget_amount)}`,
    `Расходы: ${formatMoney(object.total_expenses)}`,
    `Остаток: ${formatMoney(object.balance)}`,
    `Статус: ${object.status === "active" ? "активный" : "архивный"}`
  ].join("\n");
}

export function objectCard(object: ObjectWithBudget, foremen: User[]): string {
  const lines = [objectLine(object), ""];
  if (foremen.length) {
    lines.push("Назначенные бригадиры:");
    lines.push(...foremen.map((foreman) => `• ${foreman.name}`));
  } else {
    lines.push("Бригадиры не назначены.");
  }
  const warning = budgetWarning(object.balance);
  if (warning) {
    lines.push("", warning);
  }
  return lines.join("\n");
}

export function objectListLabel(object: ObjectWithBudget): string {
  return `${object.title} · остаток ${formatMoney(object.balance)}`;
}

export function foremanLine(foreman: User, activeAssignments?: number): string {
  const parts = [`👷 ${foreman.name}`, `Telegram ID: ${foreman.telegram_id}`];
  if (foreman.username) {
    parts.push(`Username: @${foreman.username}`);
  }
  parts.push(`Статус: ${foreman.is_blocked ? "заблокирован" : "активен"}`);
  if (activeAssignments !== undefined) {
    parts.push(`Активных назначений: ${activeAssignments}`);
  }
  return parts.join("\n");
}

export function foremanCard(foreman: User, objects: ConstructionObject[]): string {
  const lines = [foremanLine(foreman), ""];
  if (objects.length) {
    lines.push("Активные объекты:");
    lines.push(...objects.map((object) => `• ${object.title}`));
  } else {
    lines.push("Активных объектов нет.");
  }
  return lines.join("\n");
}

export function expenseLine(expense: Expense): string {
  const parts = [`${translateExpenseType(expense.type)}`, expense.title, `Сумма: ${formatMoney(expense.amount)}`];

  if (expense.quantity && expense.unit && expense.unit_price) {
    parts.push(`Кол-во: ${expense.quantity} ${expense.unit}`);
    parts.push(`Цена: ${formatMoney(expense.unit_price)}`);
  }
  if (expense.comment) {
    parts.push(`Комментарий: ${expense.comment}`);
  }

  return parts.join("\n");
}

export function expenseConfirmText(type: ExpenseType, draft: ExpenseDraft): string {
  const lines = ["Проверьте расход:", "", `Тип: ${EXPENSE_TYPE_LABELS[type]}`, `Наименование: ${draft.title ?? "—"}`];

  if (type === "manual_purchase") {
    lines.push(`Количество: ${draft.quantity ?? "—"} ${draft.unit ?? ""}`.trim());
    lines.push(`Цена за единицу: ${draft.unitPriceKopecks ? formatMoney(BigInt(draft.unitPriceKopecks)) : "—"}`);
  } else {
    lines.push(`Сумма: ${draft.amountKopecks ? formatMoney(BigInt(draft.amountKopecks)) : "—"}`);
  }

  if (type === "document_purchase") {
    lines.push(`Фото документа: ${draft.documentPhotoFileId ? "есть" : "нет"}`);
  }
  if (draft.comment) {
    lines.push(`Комментарий: ${draft.comment}`);
  }

  return lines.join("\n");
}

/** Returns an over-budget warning line, or null when the balance is non-negative. */
export function budgetWarning(balance: string | bigint): string | null {
  if (BigInt(balance) < 0n) {
    return `⚠️ Превышение бюджета на ${formatMoney(-BigInt(balance))}`;
  }
  return null;
}
