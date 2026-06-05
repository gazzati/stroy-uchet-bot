import type { Services } from "../services/index.js";
import { AccessDeniedError } from "../domain/errors.js";
import { logger } from "../utils/logger.js";
import { ACCESS_DENIED_MESSAGE } from "./messages.js";
import type { AuthedContext } from "./session.js";
import type { User } from "../db/schema.js";

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
