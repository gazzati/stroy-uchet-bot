import type { ExpenseType } from "../../db/schema.js";
import type { ExpenseInput } from "../../domain/expense.js";
import { ValidationError } from "../../domain/errors.js";
import type { ExpenseDraft, ExpenseStep } from "../session.js";

/** First field prompted for every expense type. */
export const FIRST_STEP: ExpenseStep = "title";

/** Given the current step and type, returns the next step (or "confirm" when done). */
export function nextStep(type: ExpenseType, step: ExpenseStep): ExpenseStep {
  const order: Record<ExpenseType, ExpenseStep[]> = {
    manual_purchase: ["title", "quantity", "unit", "unit_price", "comment", "confirm"],
    document_purchase: ["title", "photo", "amount", "comment", "confirm"],
    bank_transfer: ["title", "amount", "comment", "confirm"],
    service_payment: ["title", "amount", "comment", "confirm"]
  };
  const steps = order[type];
  const index = steps.indexOf(step);
  return steps[index + 1] ?? "confirm";
}

/** Builds a validated ExpenseInput from the collected draft. Throws ValidationError on missing fields. */
export function buildExpenseInput(type: ExpenseType, draft: ExpenseDraft): ExpenseInput {
  const title = draft.title ?? "";
  const comment = draft.comment ?? null;

  if (type === "manual_purchase") {
    if (!draft.quantity || !draft.unit || !draft.unitPriceKopecks) {
      throw new ValidationError("Не хватает данных для ручной закупки");
    }
    return {
      type,
      title,
      quantity: draft.quantity,
      unit: draft.unit,
      unitPriceKopecks: BigInt(draft.unitPriceKopecks),
      comment
    };
  }

  if (!draft.amountKopecks) {
    throw new ValidationError("Не указана сумма");
  }

  if (type === "document_purchase") {
    return {
      type,
      title,
      amountKopecks: BigInt(draft.amountKopecks),
      documentPhotoFileId: draft.documentPhotoFileId ?? null,
      comment
    };
  }

  return { type, title, amountKopecks: BigInt(draft.amountKopecks), comment };
}
