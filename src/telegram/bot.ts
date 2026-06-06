import { Bot, session } from "grammy";
import type { AppConfig } from "../config/index.js";
import { AppError } from "../domain/errors.js";
import type { Services } from "../services/index.js";
import { logger } from "../utils/logger.js";
import { authMiddleware, publicAccessMiddleware } from "./auth.js";
import { describeCallback } from "./callbacks/actions.js";
import { registerCallbackRouter } from "./callbacks/router.js";
import { showMainMenu } from "./flows/main-menu.js";
import { initialSession, type AuthedContext } from "./session.js";
import { dispatchTextStep } from "./wizards/text-step.js";
import { dispatchPhotoStep } from "./wizards/photo-step.js";

export function createBot(config: AppConfig, services: Services): Bot<AuthedContext> {
  const bot = new Bot<AuthedContext>(config.botToken);

  // First thing: log every incoming update unconditionally (before session/auth),
  // so we can see updates from any user — including ones later rejected by auth.
  bot.use(async (ctx, next) => {
    logger.info({ telegramId: ctx.from?.id, action: describeUpdate(ctx) }, "Incoming update");
    await next();
  });

  bot.use(session({ initial: initialSession }));

  bot.use(async (ctx, next) => {
    const start = Date.now();
    await next();
    logger.debug({ telegramId: ctx.from?.id, ms: Date.now() - start }, "Update handled");
  });

  bot.use(publicAccessMiddleware(services));
  bot.use(authMiddleware(services));

  const openMenu = async (ctx: AuthedContext) => {
    ctx.session.flow = null;
    await showMainMenu(ctx);
  };
  bot.command("start", openMenu);
  bot.command("menu", openMenu);

  registerCallbackRouter(bot, services, config);

  bot.on("message:photo", (ctx) => dispatchPhotoStep(ctx));
  bot.on("message:text", (ctx) => dispatchTextStep(ctx, services));

  bot.catch(async (error) => {
    const ctx = error.ctx;
    const err = error.error;
    const isExpected = err instanceof AppError;
    const message = isExpected ? err.message : "Произошла ошибка. Попробуйте еще раз.";
    logger[isExpected ? "warn" : "error"](
      { err, telegramId: ctx.from?.id, update: ctx.update.update_id },
      "Error while handling update"
    );
    await ctx.reply(message);
  });

  return bot;
}

/** Short description of an update for debug logs (which button/text). */
function describeUpdate(ctx: AuthedContext): string {
  if (ctx.callbackQuery?.data) {
    return `callback ${describeCallback(ctx.callbackQuery.data)}`;
  }
  if (ctx.message?.photo) {
    return "photo";
  }
  const text = ctx.message?.text;
  if (text) {
    return text.startsWith("/") ? `command ${text}` : `text ${text}`;
  }
  return "update";
}
