import { InlineKeyboard } from "grammy";
import type { User } from "../../db/schema.js";
import { CB, cb } from "../callbacks/actions.js";

export function mainMenuKeyboard(user: User): InlineKeyboard {
  if (user.role === "admin") {
    return new InlineKeyboard()
      .text("🏗 Объекты", cb(CB.OBJ_LIST))
      .text("👷 Бригадиры", cb(CB.FRM_LIST));
  }

  return new InlineKeyboard()
    .text("🏗 Мои объекты", cb(CB.OBJ_LIST))
    .row()
    .text("➕ Добавить расход", cb(CB.EXP_ADD))
    .row()
    .text("📋 Мои расходы", cb(CB.MY_EXP));
}
