import type { Services } from "../../services/index.js";
import { requireAdmin } from "../auth.js";
import type { AuthedContext } from "../session.js";
import { applicationsListKeyboard, applicationCardKeyboard } from "../keyboards/applications.js";
import { foremanApplicationLine } from "../messages.js";
import { showForemanCard } from "./foremen.js";
import { renderScreen } from "./main-menu.js";

export async function showApplicationsList(ctx: AuthedContext, services: Services, page = 0): Promise<void> {
  const applications = await services.users.listPendingForemanApplications();
  const text = applications.length ? "📝 Заявки от бригадиров" : "Новых заявок нет.";
  await renderScreen(ctx, text, applicationsListKeyboard(applications, page));
}

export async function showApplicationCard(
  ctx: AuthedContext,
  services: Services,
  applicationId: string
): Promise<void> {
  const application = await services.users.requireForemanApplication(applicationId);
  await renderScreen(ctx, foremanApplicationLine(application), applicationCardKeyboard(application.id));
}

export async function acceptApplication(
  ctx: AuthedContext,
  services: Services,
  applicationId: string
): Promise<void> {
  const admin = requireAdmin(ctx);
  const foreman = await services.users.acceptForemanApplication(applicationId, admin.id);
  await ctx.api
    .sendMessage(foreman.telegram_id, "Заявка принята. Теперь вам доступно меню бригадира: /start")
    .catch(() => {});
  await ctx.reply("Заявка принята. Бригадир получил доступ.");
  await showForemanCard(ctx, services, foreman.id);
}

export async function declineApplication(
  ctx: AuthedContext,
  services: Services,
  applicationId: string
): Promise<void> {
  const admin = requireAdmin(ctx);
  const application = await services.users.requireForemanApplication(applicationId);
  await services.users.declineForemanApplication(applicationId, admin.id);
  await ctx.api.sendMessage(application.telegram_id, "Заявка на доступ отклонена.").catch(() => {});
  await ctx.reply("Заявка отклонена.");
  await showApplicationsList(ctx, services, 0);
}
