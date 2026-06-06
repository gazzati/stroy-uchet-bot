import type { Services } from "../services/index.js";
import { AccessDeniedError } from "../domain/errors.js";
import { logger } from "../utils/logger.js";
import { ACCESS_DENIED_MESSAGE } from "./messages.js";
import type { AuthedContext } from "./session.js";
import type { User } from "../db/schema.js";

const APPLICATION_PENDING_MESSAGE =
  "Заявка отправлена администратору. Дождитесь подтверждения доступа.";
const APPLICATION_START_MESSAGE = "Для заявки на доступ введите имя и фамилию одним сообщением:";

/**
 * Loads the current user onto ctx for every update (commands, messages, callbacks).
 * Unregistered/blocked users are rejected before reaching any handler, so a foreman
 * who loses access mid-flow is stopped here on their next interaction.
 */
export function authMiddleware(services: Services) {
  return async (ctx: AuthedContext, next: () => Promise<void>) => {
    const telegramId = ctx.from?.id;
    if (!telegramId) {
      await ctx.reply(ACCESS_DENIED_MESSAGE);
      return;
    }

    const user = await services.users.findByTelegramId(BigInt(telegramId));
    if (!user) {
      logger.warn({ telegramId }, "Access denied: unknown user");
      ctx.session.flow = null;
      await ctx.reply(ACCESS_DENIED_MESSAGE);
      return;
    }

    ctx.user = user;
    await next();
  };
}

/**
 * Lets unknown users submit a foreman access application before the strict auth
 * middleware rejects everything else.
 */
export function publicAccessMiddleware(services: Services) {
  return async (ctx: AuthedContext, next: () => Promise<void>) => {
    const telegramId = ctx.from?.id;
    if (!telegramId) {
      await ctx.reply(ACCESS_DENIED_MESSAGE);
      return;
    }

    const user = await services.users.findByTelegramId(BigInt(telegramId), { includeBlocked: true });
    if (user && !user.is_blocked) {
      if (ctx.session.flow?.kind === "foreman_application") {
        ctx.session.flow = null;
      }
      await next();
      return;
    }

    if (user?.is_blocked) {
      ctx.session.flow = null;
      await ctx.reply(ACCESS_DENIED_MESSAGE);
      return;
    }

    const pendingApplication = await services.users.findPendingForemanApplication(BigInt(telegramId));
    const text = ctx.message?.text?.trim();

    if (text === "/start") {
      if (pendingApplication) {
        ctx.session.flow = null;
        await ctx.reply(APPLICATION_PENDING_MESSAGE);
        return;
      }

      ctx.session.flow = { kind: "foreman_application", step: "name" };
      await ctx.reply(APPLICATION_START_MESSAGE);
      return;
    }

    if (ctx.session.flow?.kind === "foreman_application" && text && !text.startsWith("/")) {
      const parts = text.split(/\s+/).filter(Boolean);
      if (parts.length < 2) {
        await ctx.reply("Введите имя и фамилию, например: Иван Петров");
        return;
      }

      await services.users.createOrUpdateForemanApplication({
        telegramId: BigInt(telegramId),
        name: text,
        username: ctx.from?.username ?? null
      });
      ctx.session.flow = null;
      await ctx.reply(APPLICATION_PENDING_MESSAGE);
      return;
    }

    ctx.session.flow = null;
    await ctx.reply(pendingApplication ? APPLICATION_PENDING_MESSAGE : "Нажмите /start, чтобы подать заявку на доступ.");
  };
}

export function requireUser(ctx: AuthedContext): User {
  if (!ctx.user) {
    throw new AccessDeniedError();
  }
  return ctx.user;
}

export function requireAdmin(ctx: AuthedContext): User {
  const user = requireUser(ctx);
  if (user.role !== "admin") {
    throw new AccessDeniedError();
  }
  return user;
}

export function isAdmin(ctx: AuthedContext): boolean {
  return ctx.user?.role === "admin";
}
