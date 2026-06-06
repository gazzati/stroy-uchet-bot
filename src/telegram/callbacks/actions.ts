import type { ExpenseType } from "../../db/schema.js";

/**
 * Compact callback_data codes. Telegram limits callback_data to 64 bytes;
 * codes are short and ids are UUIDs (~36 chars), so `CODE:uuid` stays well under the limit.
 */
export const CB = {
  MENU: "M",

  OBJ_LIST: "OL",
  OBJ_ARCH_LIST: "OAL",
  OBJ: "O",
  OBJ_NEW: "ON",
  OBJ_RENAME: "ORN",
  OBJ_BUDGET: "OB",
  OBJ_ASSIGN: "OAS",
  OBJ_ASSIGN_DO: "OASD",
  OBJ_DETACH: "ODT",
  OBJ_DETACH_DO: "ODTD",
  OBJ_ARCHIVE: "OA",
  OBJ_ARCHIVE_CONFIRM: "OAC",
  OBJ_RESTORE: "OR",
  OBJ_RESTORE_CONFIRM: "ORC",
  OBJ_EXPENSES: "OE",

  FRM_LIST: "FL",
  FRM: "F",
  FRM_NEW: "FN",
  FRM_RENAME: "FRN",
  FRM_BLOCK: "FB",
  FRM_DEL: "FD",
  FRM_DEL_CONFIRM: "FDC",

  APP_LIST: "AL",
  APP: "A",
  APP_ACCEPT: "AA",
  APP_DECLINE: "AD",

  EXP_ADD: "EA",
  EXP_OBJ: "EO",
  EXP_TYPE: "ET",
  EXP_SKIP: "ESK",
  EXP_UNIT: "EU",
  EXP_SAVE: "ES",
  EXP_CANCEL: "EC",
  MY_EXP: "ME",
  EXP: "E",
  EXP_EDIT: "EE",
  EXP_DEL: "ED",
  EXP_DEL_CONFIRM: "EDC",

  REP_OBJ: "RO",

  PAGE: "P",
  NOOP: "x"
} as const;

export type CbCode = (typeof CB)[keyof typeof CB];

/** Codes that only an admin may trigger. Enforced centrally in the router. */
export const ADMIN_CODES = new Set<string>([
  CB.OBJ_ARCH_LIST,
  CB.OBJ_NEW,
  CB.OBJ_RENAME,
  CB.OBJ_BUDGET,
  CB.OBJ_ASSIGN,
  CB.OBJ_ASSIGN_DO,
  CB.OBJ_DETACH,
  CB.OBJ_DETACH_DO,
  CB.OBJ_ARCHIVE,
  CB.OBJ_ARCHIVE_CONFIRM,
  CB.OBJ_RESTORE,
  CB.OBJ_RESTORE_CONFIRM,
  CB.FRM_LIST,
  CB.FRM,
  CB.FRM_NEW,
  CB.FRM_RENAME,
  CB.FRM_BLOCK,
  CB.FRM_DEL,
  CB.FRM_DEL_CONFIRM,
  CB.APP_LIST,
  CB.APP,
  CB.APP_ACCEPT,
  CB.APP_DECLINE,
  CB.REP_OBJ
]);

export function cb(code: string, ...args: string[]): string {
  const data = [code, ...args].join(":");
  if (Buffer.byteLength(data, "utf8") > 64) {
    throw new Error(`callback_data too long (${Buffer.byteLength(data, "utf8")} bytes): ${data}`);
  }
  return data;
}

export function parseCb(data: string): { code: string; args: string[] } {
  const [code, ...args] = data.split(":");
  return { code, args };
}

/** Returns the pressed callback code (with args) for logging, e.g. "OBJ [42]". */
export function describeCallback(data: string): string {
  const { code, args } = parseCb(data);
  return args.length ? `${code} [${args.join(", ")}]` : code;
}

/** Quick-pick measurement units for manual purchases, addressed by index in callback_data. */
export const UNITS = ["шт", "м", "м2", "м3", "кг", "л", "уп", "меш"] as const;

export const EXPENSE_TYPE_LABELS: Record<ExpenseType, string> = {
  manual_purchase: "Ручная закупка",
  document_purchase: "Чек / накладная",
  bank_transfer: "Безналичная операция",
  service_payment: "Оплата услуг"
};

/** Compact codes for expense types in callback_data. */
export const EXPENSE_TYPE_BY_CODE: Record<string, ExpenseType> = {
  m: "manual_purchase",
  d: "document_purchase",
  b: "bank_transfer",
  s: "service_payment"
};

export const CODE_BY_EXPENSE_TYPE: Record<ExpenseType, string> = {
  manual_purchase: "m",
  document_purchase: "d",
  bank_transfer: "b",
  service_payment: "s"
};
