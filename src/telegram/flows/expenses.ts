import type { Services } from "../../services/index.js";
import type { Expense } from "../../db/schema.js";
import { requireUser, isAdmin } from "../auth.js";
import type { AuthedContext } from "../session.js";
import { expenseLine } from "../messages.js";
import {
  deleteExpenseConfirmKeyboard,
  expenseCardKeyboard,
  expensesListKeyboard
} from "../keyboards/expenses.js";
import { CB, cb } from "../callbacks/actions.js";
import { renderScreen, renderPhotoScreen } from "./main-menu.js";

export async function showMyExpenses(ctx: AuthedContext, services: Services, page = 0): Promise<void> {
  const user = requireUser(ctx);
  const expenses = await services.expenses.listUserExpenses(user);
  const text = expenses.length ? "📋 Мои расходы" : "Ваших расходов нет.";
  await renderScreen(ctx, text, expensesListKeyboard(expenses, page, CB.MY_EXP, cb(CB.MENU)));
}

export async function showObjectExpenses(
  ctx: AuthedContext,
  services: Services,
  objectId: string,
  page = 0
): Promise<void> {
  const user = requireUser(ctx);
  const expenses = await services.expenses.listObjectExpenses(user, objectId);
  const text = expenses.length ? "📋 Расходы объекта" : "Расходов по объекту нет.";
  await renderScreen(
    ctx,
    text,
    expensesListKeyboard(expenses, page, `${CB.OBJ_EXPENSES}~${objectId}`, cb(CB.OBJ, objectId))
  );
}

function canEdit(ctx: AuthedContext, expense: Expense): boolean {
  return isAdmin(ctx) || expense.author_id === requireUser(ctx).id;
}

export async function showExpenseCard(ctx: AuthedContext, services: Services, expenseId: string): Promise<void> {
  const expense = await services.expenses.requireExpense(expenseId);
  const keyboard = expenseCardKeyboard(expense, { canEdit: canEdit(ctx, expense) }, cb(CB.OBJ, expense.object_id));
  const text = expenseLine(expense);

  if (expense.document_photo_file_id) {
    await renderPhotoScreen(ctx, expense.document_photo_file_id, text, keyboard);
    return;
  }
  await renderScreen(ctx, text, keyboard);
}

export async function confirmDeleteExpense(ctx: AuthedContext, services: Services, expenseId: string): Promise<void> {
  const expense = await services.expenses.requireExpense(expenseId);
  await renderScreen(ctx, `Удалить расход «${expense.title}»?`, deleteExpenseConfirmKeyboard(expenseId));
}

export async function doDeleteExpense(ctx: AuthedContext, services: Services, expenseId: string): Promise<void> {
  const user = requireUser(ctx);
  const expense = await services.expenses.requireExpense(expenseId);
  const objectId = expense.object_id;
  await services.expenses.softDeleteExpense(user, expenseId);
  await showObjectExpenses(ctx, services, objectId, 0);
}
