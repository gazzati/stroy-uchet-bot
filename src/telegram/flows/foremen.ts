import type { Services } from "../../services/index.js";
import type { AuthedContext } from "../session.js";
import { foremanCard } from "../messages.js";
import {
  deleteForemanConfirmKeyboard,
  foremanCardKeyboard,
  foremenListKeyboard
} from "../keyboards/foremen.js";
import { renderScreen } from "./main-menu.js";

export async function showForemenList(ctx: AuthedContext, services: Services, page = 0): Promise<void> {
  const foremen = await services.users.listForemenWithAssignments();
  const text = foremen.length ? "👷 Бригадиры" : "Бригадиров нет.";
  await renderScreen(ctx, text, foremenListKeyboard(foremen, page));
}

export async function showForemanCard(
  ctx: AuthedContext,
  services: Services,
  foremanId: string,
  notice?: string
): Promise<void> {
  const foreman = await services.users.requireUser(foremanId);
  const objects = await services.users.listObjectsForForeman(foremanId);
  const text = notice ? `${notice}\n\n${foremanCard(foreman, objects)}` : foremanCard(foreman, objects);
  await renderScreen(ctx, text, foremanCardKeyboard(foreman));
}

export async function toggleBlock(ctx: AuthedContext, services: Services, foremanId: string): Promise<void> {
  const foreman = await services.users.requireUser(foremanId);
  await services.users.blockUser(foremanId, !foreman.is_blocked);
  await showForemanCard(ctx, services, foremanId);
}

export async function confirmDeleteForeman(ctx: AuthedContext, services: Services, foremanId: string): Promise<void> {
  const foreman = await services.users.requireUser(foremanId);
  await renderScreen(
    ctx,
    `Удалить бригадира «${foreman.name}»?\nОн будет откреплён от всех объектов.`,
    deleteForemanConfirmKeyboard(foremanId)
  );
}

export async function doDeleteForeman(ctx: AuthedContext, services: Services, foremanId: string): Promise<void> {
  await services.users.softDeleteForeman(foremanId);
  await showForemenList(ctx, services, 0);
}
