import type { Services } from "../../services/index.js";
import type { AuthedContext } from "../session.js";
import { showMainMenu } from "../flows/main-menu.js";
import { handleExpenseText } from "./add-expense.js";
import {
  handleCreateForeman,
  handleCreateObject,
  handleObjectBudget,
  handleRenameForeman,
  handleRenameObject
} from "./simple.js";

/** Routes a free-text message to the currently active wizard flow, if any. */
export async function dispatchTextStep(ctx: AuthedContext, services: Services): Promise<void> {
  const text = ctx.message?.text;
  if (text === undefined) {
    return;
  }
  // Slash-commands (e.g. /start) are handled by their own handlers, not as wizard field input.
  if (text.startsWith("/")) {
    return;
  }

  const flow = ctx.session.flow;
  if (!flow) {
    // The bot is button-driven; free text outside a wizard gets a nudge instead of silence.
    await ctx.reply("Управляйте ботом через кнопки. Открыть меню — /start");
    await showMainMenu(ctx);
    return;
  }

  switch (flow.kind) {
    case "create_object":
      await handleCreateObject(ctx, services, flow, text);
      break;
    case "create_foreman":
      await handleCreateForeman(ctx, services, flow, text);
      break;
    case "rename_object":
      await handleRenameObject(ctx, services, flow, text);
      break;
    case "object_budget":
      await handleObjectBudget(ctx, services, flow, text);
      break;
    case "rename_foreman":
      await handleRenameForeman(ctx, services, flow, text);
      break;
    case "add_expense":
    case "edit_expense":
      await handleExpenseText(ctx, flow, text);
      break;
  }
}
