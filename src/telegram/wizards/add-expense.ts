import type { Services } from "../../services/index.js";
import type { ExpenseType } from "../../db/schema.js";
import { ValidationError } from "../../domain/errors.js";
import { parseMoneyToKopecks, roundManualPurchaseAmount } from "../../utils/money.js";
import { requireUser } from "../auth.js";
import type { AddExpenseFlow, AuthedContext, EditExpenseFlow } from "../session.js";
import { UNITS } from "../callbacks/actions.js";
import { expenseConfirmText, budgetWarning } from "../messages.js";
import {
  cancelKeyboard,
  confirmExpenseKeyboard,
  skipKeyboard,
  unitsKeyboard
} from "../keyboards/expenses.js";
import { showObjectCard } from "../flows/objects.js";
import { clearPrompt, sendPrompt } from "./prompt.js";
import { FIRST_STEP, buildExpenseInput, nextStep } from "./expense-fields.js";

type ExpenseFlow = AddExpenseFlow | EditExpenseFlow;

/** Prompts the user for whatever the current step needs. */
export async function promptStep(ctx: AuthedContext, flow: ExpenseFlow): Promise<void> {
  switch (flow.step) {
    case "title":
      await sendPrompt(ctx, "Введите наименование:", cancelKeyboard());
      break;
    case "quantity":
      await sendPrompt(ctx, "Введите количество (например 2 или 2,5):", cancelKeyboard());
      break;
    case "unit":
      await sendPrompt(ctx, "Выберите единицу измерения или введите свою:", unitsKeyboard());
      break;
    case "unit_price":
      await sendPrompt(ctx, "Введите цену за единицу:", cancelKeyboard());
      break;
    case "amount":
      await sendPrompt(ctx, "Введите сумму:", cancelKeyboard());
      break;
    case "photo":
      await sendPrompt(ctx, "Пришлите фото документа или пропустите:", skipKeyboard());
      break;
    case "comment":
      await sendPrompt(ctx, "Добавьте комментарий или пропустите:", skipKeyboard());
      break;
    case "confirm":
      await sendPrompt(ctx, expenseConfirmText(flow.type, flow.draft), confirmExpenseKeyboard());
      break;
  }
}

function advance(flow: ExpenseFlow): void {
  flow.step = nextStep(flow.type, flow.step);
}

/** Handles a text message for the active expense flow. Returns true if it consumed the input. */
export async function handleExpenseText(ctx: AuthedContext, flow: ExpenseFlow, text: string): Promise<void> {
  const value = text.trim();

  switch (flow.step) {
    case "title": {
      if (!value) throw new ValidationError("Наименование не может быть пустым");
      flow.draft.title = value;
      advance(flow);
      break;
    }
    case "quantity": {
      // Validate via the same rounding parser the domain uses (throws on bad input).
      roundManualPurchaseAmount(value, 1n);
      flow.draft.quantity = value;
      advance(flow);
      break;
    }
    case "unit": {
      if (!value) throw new ValidationError("Единица измерения не может быть пустой");
      flow.draft.unit = value;
      advance(flow);
      break;
    }
    case "unit_price": {
      flow.draft.unitPriceKopecks = parseMoneyToKopecks(value).toString();
      advance(flow);
      break;
    }
    case "amount": {
      flow.draft.amountKopecks = parseMoneyToKopecks(value).toString();
      advance(flow);
      break;
    }
    case "comment": {
      flow.draft.comment = value || null;
      advance(flow);
      break;
    }
    default:
      // Steps awaiting a button (unit picker / photo / confirm) ignore stray text.
      return;
  }

  await promptStep(ctx, flow);
}

/** Handles the "skip" button on photo/comment steps. */
export async function handleExpenseSkip(ctx: AuthedContext, flow: ExpenseFlow): Promise<void> {
  if (flow.step === "photo") {
    flow.draft.documentPhotoFileId = null;
  } else if (flow.step === "comment") {
    flow.draft.comment = null;
  } else {
    return;
  }
  advance(flow);
  await promptStep(ctx, flow);
}

/** Handles a quick-pick unit button. */
export async function handleExpenseUnit(ctx: AuthedContext, flow: ExpenseFlow, index: number): Promise<void> {
  if (flow.step !== "unit") return;
  const unit = UNITS[index];
  if (!unit) return;
  flow.draft.unit = unit;
  advance(flow);
  await promptStep(ctx, flow);
}

/** Handles a document photo for the photo step. */
export async function handleExpensePhoto(ctx: AuthedContext, flow: ExpenseFlow, fileId: string): Promise<void> {
  if (flow.step !== "photo") return;
  flow.draft.documentPhotoFileId = fileId;
  advance(flow);
  await promptStep(ctx, flow);
}

/** Builds the input, persists via the service, clears the flow and shows the updated object card. */
export async function saveExpense(ctx: AuthedContext, services: Services, flow: ExpenseFlow): Promise<void> {
  const user = requireUser(ctx);
  const input = buildExpenseInput(flow.type, flow.draft);

  if (flow.kind === "edit_expense") {
    await services.expenses.updateExpense(user, flow.expenseId, input);
  } else {
    await services.expenses.createExpense(user, flow.objectId, input);
  }

  const objectId = flow.objectId;
  ctx.session.flow = null;
  await clearPrompt(ctx);

  const object = await services.objects.getObjectWithBudget(objectId);
  const warning = budgetWarning(object.balance);
  await ctx.reply(warning ? `Расход сохранён.\n${warning}` : "Расход сохранён.");
  await showObjectCard(ctx, services, objectId);
}

/** Starts a fresh add-expense flow for the chosen object and type. */
export function startAddExpense(objectId: string, type: ExpenseType): AddExpenseFlow {
  return { kind: "add_expense", objectId, type, step: FIRST_STEP, draft: {} };
}
