import type { InlineKeyboard } from "grammy";
import type { AuthedContext } from "../session.js";
import { requireUser } from "../auth.js";
import { mainMenuKeyboard } from "../keyboards/main-menu.js";
import { mainMenuTitle } from "../messages.js";

/**
 * Renders a screen as the latest chat message. Callback-driven navigation removes
 * the previous button screen first, so stale controls do not remain above new bot
 * messages such as documents or confirmations.
 */
export async function renderScreen(ctx: AuthedContext, text: string, keyboard: InlineKeyboard): Promise<void> {
  if (ctx.callbackQuery) {
    await ctx.deleteMessage().catch(() => {});
  }
  await ctx.reply(text, { reply_markup: keyboard });
}

/**
 * Renders a screen as a photo with caption. A text message can't be edited into a
 * photo, so the previous message (list/menu) is removed and a fresh photo is sent.
 */
export async function renderPhotoScreen(
  ctx: AuthedContext,
  fileId: string,
  caption: string,
  keyboard: InlineKeyboard
): Promise<void> {
  if (ctx.callbackQuery) {
    await ctx.deleteMessage().catch(() => {});
  }
  await ctx.replyWithPhoto(fileId, { caption, reply_markup: keyboard });
}

export async function showMainMenu(ctx: AuthedContext): Promise<void> {
  const user = requireUser(ctx);
  await renderScreen(ctx, mainMenuTitle(user), mainMenuKeyboard(user));
}
