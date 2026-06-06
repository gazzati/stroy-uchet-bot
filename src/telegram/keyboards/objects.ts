import { InlineKeyboard } from "grammy";
import type { User } from "../../db/schema.js";
import type { ObjectWithBudget } from "../../services/objects.js";
import { CB, cb } from "../callbacks/actions.js";
import { objectListLabel } from "../messages.js";
import { appendPagination, paginate } from "./pagination.js";

export function objectsListKeyboard(
  objects: ObjectWithBudget[],
  page: number,
  options: { admin: boolean }
): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  const paged = paginate(objects, page);

  for (const object of paged.items) {
    keyboard.text(objectListLabel(object), cb(CB.OBJ, object.id)).row();
  }

  appendPagination(keyboard, CB.OBJ_LIST, paged.page, paged.totalPages);
  keyboard.row();
  if (options.admin) {
    keyboard.text("➕ Создать объект", cb(CB.OBJ_NEW)).row();
    keyboard.text("🗄 Архив", cb(CB.OBJ_ARCH_LIST)).row();
  }
  keyboard.text("◀️ Меню", cb(CB.MENU));
  return keyboard;
}

export function archivedObjectsKeyboard(objects: ObjectWithBudget[], page: number): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  const paged = paginate(objects, page);

  for (const object of paged.items) {
    keyboard.text(object.title, cb(CB.OBJ, object.id)).row();
  }

  appendPagination(keyboard, CB.OBJ_ARCH_LIST, paged.page, paged.totalPages);
  keyboard.row().text("◀️ Объекты", cb(CB.OBJ_LIST));
  return keyboard;
}

export function objectCardKeyboard(object: ObjectWithBudget, options: { admin: boolean }): InlineKeyboard {
  const keyboard = new InlineKeyboard();

  if (object.status === "active") {
    keyboard.text("➕ Расход", cb(CB.EXP_OBJ, object.id)).text("📋 Расходы", cb(CB.OBJ_EXPENSES, object.id)).row();
  } else {
    keyboard.text("📋 Расходы", cb(CB.OBJ_EXPENSES, object.id)).row();
  }

  if (options.admin) {
    if (object.status === "active") {
      keyboard
        .text("✏️ Переименовать", cb(CB.OBJ_RENAME, object.id))
        .text("💰 Бюджет", cb(CB.OBJ_BUDGET, object.id))
        .row()
        .text("👷 Назначить", cb(CB.OBJ_ASSIGN, object.id))
        .text("🔗 Открепить", cb(CB.OBJ_DETACH, object.id))
        .row()
        .text("🗄 Архивировать", cb(CB.OBJ_ARCHIVE, object.id))
        .row();
    } else {
      keyboard.text("♻️ Восстановить", cb(CB.OBJ_RESTORE, object.id)).row();
    }
    keyboard.text("📊 Отчёт", cb(CB.REP_OBJ, object.id)).row();
  }

  keyboard.text("◀️ Объекты", object.status === "active" ? cb(CB.OBJ_LIST) : cb(CB.OBJ_ARCH_LIST));
  return keyboard;
}

export function archiveConfirmKeyboard(objectId: string): InlineKeyboard {
  return new InlineKeyboard()
    .text("✅ Да, архивировать", cb(CB.OBJ_ARCHIVE_CONFIRM, objectId))
    .row()
    .text("Отмена", cb(CB.OBJ, objectId));
}

export function restoreConfirmKeyboard(objectId: string): InlineKeyboard {
  return new InlineKeyboard()
    .text("✅ Да, восстановить", cb(CB.OBJ_RESTORE_CONFIRM, objectId))
    .row()
    .text("Отмена", cb(CB.OBJ, objectId));
}

export function foremenPickerKeyboard(
  foremen: User[],
  objectId: string,
  actionCode: typeof CB.OBJ_ASSIGN_DO | typeof CB.OBJ_DETACH_DO
): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  for (const foreman of foremen) {
    keyboard.text(foreman.name, cb(actionCode, objectId, foreman.id)).row();
  }
  keyboard.text("◀️ Назад", cb(CB.OBJ, objectId));
  return keyboard;
}

export function objectPickerKeyboard(objects: ObjectWithBudget[], actionCode: string): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  for (const object of objects) {
    keyboard.text(object.title, cb(actionCode, object.id)).row();
  }
  keyboard.text("◀️ Меню", cb(CB.MENU));
  return keyboard;
}
