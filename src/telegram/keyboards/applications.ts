import { InlineKeyboard } from "grammy";
import type { ForemanApplication } from "../../db/schema.js";
import { CB, cb } from "../callbacks/actions.js";
import { appendPagination, paginate } from "./pagination.js";

export function applicationsListKeyboard(applications: ForemanApplication[], page: number): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  const paged = paginate(applications, page);

  for (const application of paged.items) {
    keyboard.text(application.name, cb(CB.APP, application.id)).row();
  }

  appendPagination(keyboard, CB.APP_LIST, paged.page, paged.totalPages);
  keyboard.row().text("◀️ Бригадиры", cb(CB.FRM_LIST));
  return keyboard;
}

export function applicationCardKeyboard(applicationId: string): InlineKeyboard {
  return new InlineKeyboard()
    .text("✅ Принять", cb(CB.APP_ACCEPT, applicationId))
    .text("❌ Отклонить", cb(CB.APP_DECLINE, applicationId))
    .row()
    .text("◀️ Заявки", cb(CB.APP_LIST));
}
