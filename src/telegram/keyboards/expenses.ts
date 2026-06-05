import { InlineKeyboard } from "grammy";
import type { Expense } from "../../db/schema.js";
import { CB, CODE_BY_EXPENSE_TYPE, UNITS, cb } from "../callbacks/actions.js";
import { appendPagination, paginate } from "./pagination.js";

export function expenseTypeKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("Ручная закупка", cb(CB.EXP_TYPE, CODE_BY_EXPENSE_TYPE.manual_purchase))
    .row()
    .text("Чек / накладная", cb(CB.EXP_TYPE, CODE_BY_EXPENSE_TYPE.document_purchase))
    .row()
    .text("Безналичная операция", cb(CB.EXP_TYPE, CODE_BY_EXPENSE_TYPE.bank_transfer))
    .row()
    .text("Оплата услуг", cb(CB.EXP_TYPE, CODE_BY_EXPENSE_TYPE.service_payment))
    .row()
    .text("Отмена", cb(CB.EXP_CANCEL));
}

export function unitsKeyboard(): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  UNITS.forEach((unit, index) => {
    keyboard.text(unit, cb(CB.EXP_UNIT, String(index)));
    if ((index + 1) % 4 === 0) {
      keyboard.row();
    }
  });
  keyboard.row().text("Отмена", cb(CB.EXP_CANCEL));
  return keyboard;
}

export function skipKeyboard(): InlineKeyboard {
  return new InlineKeyboard().text("Пропустить", cb(CB.EXP_SKIP)).row().text("Отмена", cb(CB.EXP_CANCEL));
}

export function cancelKeyboard(): InlineKeyboard {
  return new InlineKeyboard().text("Отмена", cb(CB.EXP_CANCEL));
}

export function confirmExpenseKeyboard(): InlineKeyboard {
  return new InlineKeyboard().text("✅ Сохранить", cb(CB.EXP_SAVE)).row().text("Отмена", cb(CB.EXP_CANCEL));
}

export function expensesListKeyboard(
  expenses: Expense[],
  page: number,
  listCode: string,
  backData: string
): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  const paged = paginate(expenses, page);

  for (const expense of paged.items) {
    keyboard.text(expense.title, cb(CB.EXP, expense.id)).row();
  }

  appendPagination(keyboard, listCode, paged.page, paged.totalPages);
  keyboard.row().text("◀️ Назад", backData);
  return keyboard;
}

export function expenseCardKeyboard(expense: Expense, options: { canEdit: boolean }, backData: string): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  if (options.canEdit) {
    keyboard
      .text("✏️ Редактировать", cb(CB.EXP_EDIT, expense.id))
      .text("🗑 Удалить", cb(CB.EXP_DEL, expense.id))
      .row();
  }
  keyboard.text("◀️ Назад", backData);
  return keyboard;
}

export function deleteExpenseConfirmKeyboard(expenseId: string): InlineKeyboard {
  return new InlineKeyboard()
    .text("✅ Да, удалить", cb(CB.EXP_DEL_CONFIRM, expenseId))
    .row()
    .text("Отмена", cb(CB.EXP, expenseId));
}
