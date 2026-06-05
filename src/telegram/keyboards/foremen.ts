import { InlineKeyboard } from "grammy";
import type { User } from "../../db/schema.js";
import type { ForemanWithAssignments } from "../../services/users.js";
import { CB, cb } from "../callbacks/actions.js";
import { appendPagination, paginate } from "./pagination.js";

export function foremenListKeyboard(foremen: ForemanWithAssignments[], page: number): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  const paged = paginate(foremen, page);

  for (const foreman of paged.items) {
    keyboard.text(`${foreman.name} · ${foreman.active_assignments} назн.`, cb(CB.FRM, foreman.id)).row();
  }

  appendPagination(keyboard, CB.FRM_LIST, paged.page, paged.totalPages);
  keyboard.row().text("➕ Добавить бригадира", cb(CB.FRM_NEW)).row().text("◀️ Меню", cb(CB.MENU));
  return keyboard;
}

export function foremanCardKeyboard(foreman: User): InlineKeyboard {
  return new InlineKeyboard()
    .text("✏️ Имя", cb(CB.FRM_RENAME, foreman.id))
    .text(foreman.is_blocked ? "🔓 Разблокировать" : "🔒 Заблокировать", cb(CB.FRM_BLOCK, foreman.id))
    .row()
    .text("🗑 Удалить", cb(CB.FRM_DEL, foreman.id))
    .row()
    .text("◀️ Бригадиры", cb(CB.FRM_LIST));
}

export function deleteForemanConfirmKeyboard(foremanId: string): InlineKeyboard {
  return new InlineKeyboard()
    .text("✅ Да, удалить", cb(CB.FRM_DEL_CONFIRM, foremanId))
    .row()
    .text("Отмена", cb(CB.FRM, foremanId));
}
