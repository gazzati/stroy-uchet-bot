import type { Services } from "../../services/index.js";
import { requireUser, isAdmin } from "../auth.js";
import type { AuthedContext } from "../session.js";
import { objectCard } from "../messages.js";
import {
  archiveConfirmKeyboard,
  archivedObjectsKeyboard,
  foremenPickerKeyboard,
  objectCardKeyboard,
  objectsListKeyboard,
  restoreConfirmKeyboard
} from "../keyboards/objects.js";
import { CB } from "../callbacks/actions.js";
import { renderScreen } from "./main-menu.js";

export async function showObjectsList(ctx: AuthedContext, services: Services, page = 0): Promise<void> {
  const user = requireUser(ctx);
  const objects = await services.objects.listActiveObjectsForUser(user);
  const text = objects.length ? "🏗 Объекты" : "Активных объектов нет.";
  await renderScreen(ctx, text, objectsListKeyboard(objects, page, { admin: user.role === "admin" }));
}

export async function showArchivedObjects(ctx: AuthedContext, services: Services, page = 0): Promise<void> {
  const objects = await services.objects.listObjectsByStatus("archived");
  const text = objects.length ? "🗄 Архив объектов" : "Архивных объектов нет.";
  await renderScreen(ctx, text, archivedObjectsKeyboard(objects, page));
}

export async function showObjectCard(ctx: AuthedContext, services: Services, objectId: string): Promise<void> {
  const object = await services.objects.getObjectWithBudget(objectId);
  const foremen = isAdmin(ctx) ? await services.objects.listForemenForObject(objectId) : [];
  await renderScreen(ctx, objectCard(object, foremen), objectCardKeyboard(object, { admin: isAdmin(ctx) }));
}

export async function confirmArchive(ctx: AuthedContext, services: Services, objectId: string): Promise<void> {
  const object = await services.objects.getObjectWithBudget(objectId);
  await renderScreen(
    ctx,
    `Архивировать объект «${object.title}»?\nДобавление расходов станет недоступно.`,
    archiveConfirmKeyboard(objectId)
  );
}

export async function doArchive(ctx: AuthedContext, services: Services, objectId: string): Promise<void> {
  await services.objects.archiveObject(objectId);
  await showObjectCard(ctx, services, objectId);
}

export async function confirmRestore(ctx: AuthedContext, services: Services, objectId: string): Promise<void> {
  const object = await services.objects.getObjectWithBudget(objectId);
  await renderScreen(ctx, `Восстановить объект «${object.title}»?`, restoreConfirmKeyboard(objectId));
}

export async function doRestore(ctx: AuthedContext, services: Services, objectId: string): Promise<void> {
  await services.objects.restoreObject(objectId);
  await showObjectCard(ctx, services, objectId);
}

export async function showAssignForeman(ctx: AuthedContext, services: Services, objectId: string): Promise<void> {
  const foremen = await services.objects.listUnassignedForemen(objectId);
  const text = foremen.length ? "Выберите бригадира для назначения:" : "Нет свободных бригадиров.";
  await renderScreen(ctx, text, foremenPickerKeyboard(foremen, objectId, CB.OBJ_ASSIGN_DO));
}

export async function doAssignForeman(
  ctx: AuthedContext,
  services: Services,
  objectId: string,
  foremanId: string
): Promise<void> {
  await services.objects.assignForeman(objectId, foremanId);
  await showObjectCard(ctx, services, objectId);
}

export async function showDetachForeman(ctx: AuthedContext, services: Services, objectId: string): Promise<void> {
  const foremen = await services.objects.listForemenForObject(objectId);
  const text = foremen.length ? "Выберите бригадира для открепления:" : "Нет назначенных бригадиров.";
  await renderScreen(ctx, text, foremenPickerKeyboard(foremen, objectId, CB.OBJ_DETACH_DO));
}

export async function doDetachForeman(
  ctx: AuthedContext,
  services: Services,
  objectId: string,
  foremanId: string
): Promise<void> {
  await services.objects.detachForeman(objectId, foremanId);
  await showObjectCard(ctx, services, objectId);
}
