import type { Services } from "../../services/index.js";
import { ValidationError } from "../../domain/errors.js";
import { parseMoneyToKopecks } from "../../utils/money.js";
import type {
  AuthedContext,
  CreateForemanFlow,
  CreateObjectFlow,
  ObjectBudgetFlow,
  RenameForemanFlow,
  RenameObjectFlow
} from "../session.js";
import { showObjectCard } from "../flows/objects.js";
import { showForemanCard } from "../flows/foremen.js";
import { clearPrompt, sendPrompt } from "./prompt.js";

export async function handleCreateObject(
  ctx: AuthedContext,
  services: Services,
  flow: CreateObjectFlow,
  text: string
): Promise<void> {
  const value = text.trim();
  if (flow.step === "title") {
    if (!value) throw new ValidationError("Название объекта не может быть пустым");
    flow.title = value;
    flow.step = "budget";
    await sendPrompt(ctx, "Введите бюджет объекта:");
    return;
  }

  const budgetAmount = parseMoneyToKopecks(value);
  const object = await services.objects.createObject({ title: flow.title ?? "", budgetAmount });
  ctx.session.flow = null;
  await clearPrompt(ctx);
  await ctx.reply("Объект создан.");
  await showObjectCard(ctx, services, object.id);
}

export async function handleCreateForeman(
  ctx: AuthedContext,
  services: Services,
  flow: CreateForemanFlow,
  text: string
): Promise<void> {
  const value = text.trim();
  if (flow.step === "telegram_id") {
    if (!/^\d+$/.test(value)) throw new ValidationError("Telegram ID должен быть числом");
    flow.telegramId = value;
    flow.step = "name";
    await sendPrompt(ctx, "Введите имя бригадира:");
    return;
  }

  const foreman = await services.users.createForeman({ telegramId: BigInt(flow.telegramId ?? "0"), name: value });
  ctx.session.flow = null;
  await clearPrompt(ctx);
  await ctx.reply("Бригадир создан.");
  await showForemanCard(ctx, services, foreman.id);
}

export async function handleRenameObject(
  ctx: AuthedContext,
  services: Services,
  flow: RenameObjectFlow,
  text: string
): Promise<void> {
  await services.objects.renameObject(flow.objectId, text);
  ctx.session.flow = null;
  await clearPrompt(ctx);
  await showObjectCard(ctx, services, flow.objectId);
}

export async function handleObjectBudget(
  ctx: AuthedContext,
  services: Services,
  flow: ObjectBudgetFlow,
  text: string
): Promise<void> {
  await services.objects.updateBudget(flow.objectId, parseMoneyToKopecks(text));
  ctx.session.flow = null;
  await clearPrompt(ctx);
  await showObjectCard(ctx, services, flow.objectId);
}

export async function handleRenameForeman(
  ctx: AuthedContext,
  services: Services,
  flow: RenameForemanFlow,
  text: string
): Promise<void> {
  await services.users.renameForeman(flow.foremanId, text);
  ctx.session.flow = null;
  await clearPrompt(ctx);
  await showForemanCard(ctx, services, flow.foremanId);
}
