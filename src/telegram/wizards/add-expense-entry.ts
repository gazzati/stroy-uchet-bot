import type { Services } from "../../services/index.js";
import type { ExpenseType } from "../../db/schema.js";
import { requireUser } from "../auth.js";
import type { AuthedContext } from "../session.js";
import { CB } from "../callbacks/actions.js";
import { objectPickerKeyboard } from "../keyboards/objects.js";
import { expenseTypeKeyboard } from "../keyboards/expenses.js";
import { renderScreen } from "../flows/main-menu.js";
import { promptStep, startAddExpense } from "./add-expense.js";
import { buildEditFlow } from "./edit-expense.js";

/** Entry from the main menu: choose an object first. */
export async function startAddExpenseFromMenu(ctx: AuthedContext, services: Services): Promise<void> {
  const user = requireUser(ctx);
  const objects = await services.objects.listActiveObjectsForUser(user);
  if (!objects.length) {
    await renderScreen(ctx, "Нет доступных объектов для расхода.", objectPickerKeyboard([], CB.EXP_OBJ));
    return;
  }
  await renderScreen(ctx, "Выберите объект для расхода:", objectPickerKeyboard(objects, CB.EXP_OBJ));
}

/** Object chosen (from menu picker or object card): prompt for the expense type. */
export async function chooseExpenseType(ctx: AuthedContext, objectId: string): Promise<void> {
  // Stash the object on a partial flow so the type handler knows the target.
  ctx.session.flow = { kind: "add_expense", objectId, type: "manual_purchase", step: "title", draft: {} };
  await renderScreen(ctx, "Выберите тип расхода:", expenseTypeKeyboard());
}

/** Type chosen: begin the field wizard. */
export async function beginExpenseWizard(ctx: AuthedContext, type: ExpenseType): Promise<void> {
  const current = ctx.session.flow;
  const objectId = current && current.kind === "add_expense" ? current.objectId : undefined;
  if (!objectId) {
    return;
  }
  const flow = startAddExpense(objectId, type);
  ctx.session.flow = flow;
  await promptStep(ctx, flow);
}

/** Edit entry: load expense, prefill draft, begin the field wizard. */
export async function startEditExpense(ctx: AuthedContext, services: Services, expenseId: string): Promise<void> {
  const flow = await buildEditFlow(services, expenseId);
  ctx.session.flow = flow;
  await promptStep(ctx, flow);
}
