import { InlineKeyboard, InputFile } from "grammy";
import type { Services } from "../../services/index.js";
import type { AppConfig } from "../../config/index.js";
import type { AuthedContext } from "../session.js";
import { expenseRowsToCsv } from "../../reports/csv.js";
import { CB, cb } from "../callbacks/actions.js";
import { renderScreen } from "./main-menu.js";

export async function showReportsMenu(ctx: AuthedContext): Promise<void> {
  const keyboard = new InlineKeyboard()
    .text("По объекту", cb(CB.REP_OBJ))
    .row()
    .text("По бригадиру", cb(CB.REP_FRM))
    .row()
    .text("◀️ Меню", cb(CB.MENU));
  await renderScreen(ctx, "📊 Отчёты — выберите тип:", keyboard);
}

export async function showReportObjectPicker(ctx: AuthedContext, services: Services): Promise<void> {
  const objects = await services.objects.listObjectsByStatus("active");
  const archived = await services.objects.listObjectsByStatus("archived");
  const all = [...objects, ...archived];
  const keyboard = new InlineKeyboard();
  for (const object of all) {
    keyboard.text(object.title, cb(CB.REP_OBJ, object.id)).row();
  }
  keyboard.text("◀️ Назад", cb(CB.REP_MENU));
  await renderScreen(ctx, all.length ? "Выберите объект:" : "Объектов нет.", keyboard);
}

export async function showReportForemanPicker(ctx: AuthedContext, services: Services): Promise<void> {
  const foremen = await services.users.listForemen();
  const keyboard = new InlineKeyboard();
  for (const foreman of foremen) {
    keyboard.text(foreman.name, cb(CB.REP_FRM, foreman.id)).row();
  }
  keyboard.text("◀️ Назад", cb(CB.REP_MENU));
  await renderScreen(ctx, foremen.length ? "Выберите бригадира:" : "Бригадиров нет.", keyboard);
}

export async function sendObjectReport(
  ctx: AuthedContext,
  services: Services,
  config: AppConfig,
  objectId: string
): Promise<void> {
  const rows = await services.reports.expensesByObject(objectId);
  await ctx.replyWithDocument(
    new InputFile(Buffer.from(expenseRowsToCsv(rows, config.timezone)), `object-${objectId}.csv`)
  );
}

export async function sendForemanReport(
  ctx: AuthedContext,
  services: Services,
  config: AppConfig,
  foremanId: string
): Promise<void> {
  const rows = await services.reports.expensesByForeman(foremanId);
  await ctx.replyWithDocument(
    new InputFile(Buffer.from(expenseRowsToCsv(rows, config.timezone)), `foreman-${foremanId}.csv`)
  );
}
