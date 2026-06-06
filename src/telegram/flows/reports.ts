import { InputFile } from "grammy";
import type { Services } from "../../services/index.js";
import type { AppConfig } from "../../config/index.js";
import type { AuthedContext } from "../session.js";
import { expenseRowsToCsv } from "../../reports/csv.js";
import { showObjectCard } from "./objects.js";

export async function sendObjectReport(
  ctx: AuthedContext,
  services: Services,
  config: AppConfig,
  objectId: string
): Promise<void> {
  if (ctx.callbackQuery) {
    await ctx.deleteMessage().catch(() => {});
  }
  const rows = await services.reports.expensesByObject(objectId);
  await ctx.replyWithDocument(
    new InputFile(Buffer.from(expenseRowsToCsv(rows, config.timezone)), `object-${objectId}.csv`)
  );
  await showObjectCard(ctx, services, objectId);
}
