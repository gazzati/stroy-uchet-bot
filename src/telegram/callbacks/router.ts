import type { Bot } from "grammy";
import type { AppConfig } from "../../config/index.js";
import type { Services } from "../../services/index.js";
import { AccessDeniedError } from "../../domain/errors.js";
import type { AuthedContext } from "../session.js";
import { ACCESS_DENIED_MESSAGE } from "../messages.js";
import { ADMIN_CODES, CB, EXPENSE_TYPE_BY_CODE, parseCb } from "./actions.js";
import { showMainMenu } from "../flows/main-menu.js";
import {
  confirmArchive,
  confirmRestore,
  doArchive,
  doAssignForeman,
  doDetachForeman,
  doRestore,
  showArchivedObjects,
  showAssignForeman,
  showDetachForeman,
  showObjectCard,
  showObjectsList
} from "../flows/objects.js";
import {
  confirmDeleteForeman,
  doDeleteForeman,
  showForemanCard,
  showForemenList,
  toggleBlock
} from "../flows/foremen.js";
import {
  acceptApplication,
  declineApplication,
  showApplicationCard,
  showApplicationsList
} from "../flows/applications.js";
import {
  confirmDeleteExpense,
  doDeleteExpense,
  showExpenseCard,
  showMyExpenses,
  showObjectExpenses
} from "../flows/expenses.js";
import {
  sendForemanReport,
  sendObjectReport,
  showReportForemanPicker,
  showReportObjectPicker,
  showReportsMenu
} from "../flows/reports.js";
import {
  beginExpenseWizard,
  chooseExpenseType,
  startAddExpenseFromMenu,
  startEditExpense
} from "../wizards/add-expense-entry.js";
import { handleExpenseSkip, handleExpenseUnit, saveExpense } from "../wizards/add-expense.js";
import { clearPrompt, sendPrompt } from "../wizards/prompt.js";

/** Starts a one-field wizard that waits for the next text message. */
async function startCreateObject(ctx: AuthedContext): Promise<void> {
  ctx.session.flow = { kind: "create_object", step: "title" };
  await sendPrompt(ctx, "Введите название объекта:");
}

async function startCreateForeman(ctx: AuthedContext): Promise<void> {
  ctx.session.flow = { kind: "create_foreman", step: "telegram_id" };
  await sendPrompt(ctx, "Введите Telegram ID бригадира:");
}

async function startRenameObject(ctx: AuthedContext, objectId: string): Promise<void> {
  ctx.session.flow = { kind: "rename_object", objectId };
  await sendPrompt(ctx, "Введите новое название объекта:");
}

async function startObjectBudget(ctx: AuthedContext, objectId: string): Promise<void> {
  ctx.session.flow = { kind: "object_budget", objectId };
  await sendPrompt(ctx, "Введите новый бюджет:");
}

async function startRenameForeman(ctx: AuthedContext, foremanId: string): Promise<void> {
  ctx.session.flow = { kind: "rename_foreman", foremanId };
  await sendPrompt(ctx, "Введите новое имя бригадира:");
}

export function registerCallbackRouter(bot: Bot<AuthedContext>, services: Services, config: AppConfig): void {
  bot.on("callback_query:data", async (ctx) => {
    await ctx.answerCallbackQuery();

    const user = ctx.user;
    if (!user) {
      ctx.session.flow = null;
      await ctx.reply(ACCESS_DENIED_MESSAGE);
      return;
    }

    const { code, args } = parseCb(ctx.callbackQuery!.data);

    if (ADMIN_CODES.has(code) && user.role !== "admin") {
      throw new AccessDeniedError();
    }

    await dispatch(ctx, services, config, code, args);
  });
}

/**
 * Callbacks that continue an in-progress wizard. Any other button press means the
 * user navigated away, so the active flow must be abandoned (otherwise a half-finished
 * wizard keeps consuming the next text message and its prompt lingers on screen).
 */
const FLOW_CONTINUATION_CODES = new Set<string>([
  CB.EXP_OBJ,
  CB.EXP_TYPE,
  CB.EXP_UNIT,
  CB.EXP_SKIP,
  CB.EXP_SAVE
]);

async function dispatch(
  ctx: AuthedContext,
  services: Services,
  config: AppConfig,
  code: string,
  args: string[]
): Promise<void> {
  const [a, b] = args;

  // Abandon any active wizard when the user navigates away via a non-continuation button,
  // removing its lingering prompt message.
  if (ctx.session.flow && !FLOW_CONTINUATION_CODES.has(code)) {
    ctx.session.flow = null;
    await clearPrompt(ctx);
  }

  switch (code) {
    case CB.MENU:
      ctx.session.flow = null;
      return showMainMenu(ctx);

    // --- Pagination: P:<listCode>:<page> ; listCode may carry an object id as "OE~<id>" ---
    case CB.PAGE:
      return dispatchPage(ctx, services, a, Number(b));
    case CB.NOOP:
      return;

    // --- Objects ---
    case CB.OBJ_LIST:
      return showObjectsList(ctx, services, 0);
    case CB.OBJ_ARCH_LIST:
      return showArchivedObjects(ctx, services, 0);
    case CB.OBJ:
      return showObjectCard(ctx, services, a);
    case CB.OBJ_NEW:
      return startCreateObject(ctx);
    case CB.OBJ_RENAME:
      return startRenameObject(ctx, a);
    case CB.OBJ_BUDGET:
      return startObjectBudget(ctx, a);
    case CB.OBJ_ASSIGN:
      return showAssignForeman(ctx, services, a);
    case CB.OBJ_ASSIGN_DO:
      return doAssignForeman(ctx, services, a, b);
    case CB.OBJ_DETACH:
      return showDetachForeman(ctx, services, a);
    case CB.OBJ_DETACH_DO:
      return doDetachForeman(ctx, services, a, b);
    case CB.OBJ_ARCHIVE:
      return confirmArchive(ctx, services, a);
    case CB.OBJ_ARCHIVE_CONFIRM:
      return doArchive(ctx, services, a);
    case CB.OBJ_RESTORE:
      return confirmRestore(ctx, services, a);
    case CB.OBJ_RESTORE_CONFIRM:
      return doRestore(ctx, services, a);
    case CB.OBJ_EXPENSES:
      return showObjectExpenses(ctx, services, a, 0);

    // --- Foremen ---
    case CB.FRM_LIST:
      return showForemenList(ctx, services, 0);
    case CB.FRM:
      return showForemanCard(ctx, services, a);
    case CB.FRM_NEW:
      return startCreateForeman(ctx);
    case CB.FRM_RENAME:
      return startRenameForeman(ctx, a);
    case CB.FRM_BLOCK:
      return toggleBlock(ctx, services, a);
    case CB.FRM_DEL:
      return confirmDeleteForeman(ctx, services, a);
    case CB.FRM_DEL_CONFIRM:
      return doDeleteForeman(ctx, services, a);

    // --- Foreman applications ---
    case CB.APP_LIST:
      return showApplicationsList(ctx, services, 0);
    case CB.APP:
      return showApplicationCard(ctx, services, a);
    case CB.APP_ACCEPT:
      return acceptApplication(ctx, services, a);
    case CB.APP_DECLINE:
      return declineApplication(ctx, services, a);

    // --- Expenses (view/edit/delete) ---
    case CB.MY_EXP:
      return showMyExpenses(ctx, services, 0);
    case CB.EXP:
      return showExpenseCard(ctx, services, a);
    case CB.EXP_EDIT:
      return startEditExpense(ctx, services, a);
    case CB.EXP_DEL:
      return confirmDeleteExpense(ctx, services, a);
    case CB.EXP_DEL_CONFIRM:
      return doDeleteExpense(ctx, services, a);

    // --- Add expense wizard ---
    case CB.EXP_ADD:
      return startAddExpenseFromMenu(ctx, services);
    case CB.EXP_OBJ:
      return chooseExpenseType(ctx, a);
    case CB.EXP_TYPE: {
      const type = EXPENSE_TYPE_BY_CODE[a];
      if (type) return beginExpenseWizard(ctx, type);
      return;
    }
    case CB.EXP_UNIT:
      return withExpenseFlow(ctx, (flow) => handleExpenseUnit(ctx, flow, Number(a)));
    case CB.EXP_SKIP:
      return withExpenseFlow(ctx, (flow) => handleExpenseSkip(ctx, flow));
    case CB.EXP_SAVE:
      return withExpenseFlow(ctx, (flow) => saveExpense(ctx, services, flow));
    case CB.EXP_CANCEL:
      ctx.session.flow = null;
      await ctx.reply("Отменено.");
      return showMainMenu(ctx);

    // --- Reports ---
    case CB.REP_MENU:
      return showReportsMenu(ctx);
    case CB.REP_OBJ:
      return a ? sendObjectReport(ctx, services, config, a) : showReportObjectPicker(ctx, services);
    case CB.REP_FRM:
      return a ? sendForemanReport(ctx, services, config, a) : showReportForemanPicker(ctx, services);

    default:
      // Unknown / orphaned callback (e.g. session lost after restart) — fall back to the menu.
      ctx.session.flow = null;
      return showMainMenu(ctx);
  }
}

/** Runs a callback that requires an active expense flow; if none, gracefully shows the menu. */
async function withExpenseFlow(
  ctx: AuthedContext,
  run: (flow: NonNullable<AuthedContext["session"]["flow"]> & { kind: "add_expense" | "edit_expense" }) => Promise<void>
): Promise<void> {
  const flow = ctx.session.flow;
  if (!flow || (flow.kind !== "add_expense" && flow.kind !== "edit_expense")) {
    ctx.session.flow = null;
    await showMainMenu(ctx);
    return;
  }
  await run(flow);
}

async function dispatchPage(ctx: AuthedContext, services: Services, listCode: string, page: number): Promise<void> {
  if (Number.isNaN(page)) return;

  // Per-object expense lists encode the object id as "OE~<id>".
  if (listCode.startsWith(`${CB.OBJ_EXPENSES}~`)) {
    const objectId = listCode.slice(CB.OBJ_EXPENSES.length + 1);
    return showObjectExpenses(ctx, services, objectId, page);
  }

  switch (listCode) {
    case CB.OBJ_LIST:
      return showObjectsList(ctx, services, page);
    case CB.OBJ_ARCH_LIST:
      return showArchivedObjects(ctx, services, page);
    case CB.FRM_LIST:
      return showForemenList(ctx, services, page);
    case CB.APP_LIST:
      return showApplicationsList(ctx, services, page);
    case CB.MY_EXP:
      return showMyExpenses(ctx, services, page);
    default:
      return;
  }
}
