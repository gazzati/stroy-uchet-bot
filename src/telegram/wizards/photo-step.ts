import type { AuthedContext } from "../session.js";
import { handleExpensePhoto } from "./add-expense.js";

/** Routes an incoming photo to an active expense flow waiting on a document photo. */
export async function dispatchPhotoStep(ctx: AuthedContext): Promise<void> {
  const flow = ctx.session.flow;
  if (!flow || (flow.kind !== "add_expense" && flow.kind !== "edit_expense") || flow.step !== "photo") {
    await ctx.reply("Фото можно прикрепить только на шаге добавления документа.");
    return;
  }

  const fileId = ctx.message?.photo?.at(-1)?.file_id;
  if (!fileId) {
    await ctx.reply("Не удалось прочитать фото. Попробуйте ещё раз или пропустите.");
    return;
  }

  await handleExpensePhoto(ctx, flow, fileId);
}
