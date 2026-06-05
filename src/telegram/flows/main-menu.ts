import type { InlineKeyboard } from "grammy";
import type { AuthedContext } from "../session.js";
import { requireUser } from "../auth.js";
import { mainMenuKeyboard } from "../keyboards/main-menu.js";
import { mainMenuTitle } from "../messages.js";

/**
 * Renders a screen: edits the current message when triggered from a callback,
 * otherwise sends a new message (commands, after wizard steps).
 */
export async function renderScreen(ctx: AuthedContext, text: string, keyboard: InlineKeyboard): Promise<void> {
  if (ctx.callbackQuery) {
    try {
      await ctx.editMessageText(text, { reply_markup: keyboard });
      return;
    } catch {
      // Message may be unchanged or no longer editable (e.g. it had a document); fall back to a new message.
    }
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
