import type { InlineKeyboard } from "grammy";
import type { AuthedContext } from "../session.js";

/**
 * Sends a wizard prompt and remembers its message_id, so the prompt can be removed
 * later when the user abandons the flow (e.g. taps a navigation button).
 */
export async function sendPrompt(ctx: AuthedContext, text: string, keyboard?: InlineKeyboard): Promise<void> {
  await clearPrompt(ctx);
  const message = await ctx.reply(text, keyboard ? { reply_markup: keyboard } : undefined);
  ctx.session.promptMessageId = message.message_id;
}

/** Deletes the last remembered wizard prompt, if any. Best-effort (ignores already-deleted messages). */
export async function clearPrompt(ctx: AuthedContext): Promise<void> {
  const messageId = ctx.session.promptMessageId;
  const chatId = ctx.chat?.id;
  if (messageId === undefined || chatId === undefined) {
    ctx.session.promptMessageId = undefined;
    return;
  }
  ctx.session.promptMessageId = undefined;
  try {
    await ctx.api.deleteMessage(chatId, messageId);
  } catch {
    // Message may already be gone or too old to delete; nothing to do.
  }
}
