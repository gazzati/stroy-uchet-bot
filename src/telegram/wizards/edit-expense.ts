import type { Services } from "../../services/index.js";
import type { EditExpenseFlow } from "../session.js";
import { FIRST_STEP } from "./expense-fields.js";

/** Loads an expense and builds an edit flow with the draft prefilled from its current values. */
export async function buildEditFlow(services: Services, expenseId: string): Promise<EditExpenseFlow> {
  const expense = await services.expenses.requireExpense(expenseId);

  return {
    kind: "edit_expense",
    expenseId,
    objectId: expense.object_id,
    type: expense.type,
    step: FIRST_STEP,
    draft: {
      title: expense.title,
      quantity: expense.quantity ?? undefined,
      unit: expense.unit ?? undefined,
      unitPriceKopecks: expense.unit_price ?? undefined,
      amountKopecks: expense.amount,
      documentPhotoFileId: expense.document_photo_file_id,
      comment: expense.comment
    }
  };
}
