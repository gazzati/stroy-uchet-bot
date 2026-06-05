import type { ExpenseType } from "../db/schema.js";
import { roundManualPurchaseAmount } from "../utils/money.js";
import { ValidationError } from "./errors.js";

export type ManualPurchaseInput = {
  type: "manual_purchase";
  title: string;
  quantity: string;
  unit: string;
  unitPriceKopecks: bigint;
  comment?: string | null;
};

export type DocumentPurchaseInput = {
  type: "document_purchase";
  title: string;
  amountKopecks: bigint;
  documentPhotoFileId?: string | null;
  comment?: string | null;
};

export type BankTransferInput = {
  type: "bank_transfer";
  title: string;
  amountKopecks: bigint;
  comment?: string | null;
};

export type ServicePaymentInput = {
  type: "service_payment";
  title: string;
  amountKopecks: bigint;
  comment?: string | null;
};

export type ExpenseInput = ManualPurchaseInput | DocumentPurchaseInput | BankTransferInput | ServicePaymentInput;

export type NormalizedExpense = {
  type: ExpenseType;
  title: string;
  amount: bigint;
  quantity: string | null;
  unit: string | null;
  unitPrice: bigint | null;
  documentPhotoFileId: string | null;
  comment: string | null;
};

function nonEmpty(value: string, fieldName: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new ValidationError(`${fieldName} не может быть пустым`);
  }
  return trimmed;
}

function positiveMoney(value: bigint, fieldName: string): bigint {
  if (value <= 0n) {
    throw new ValidationError(`${fieldName} должна быть больше нуля`);
  }
  return value;
}

export function normalizeExpenseInput(input: ExpenseInput): NormalizedExpense {
  const title = nonEmpty(input.title, "Наименование");
  const comment = input.comment?.trim() || null;

  if (input.type === "manual_purchase") {
    const unit = nonEmpty(input.unit, "Единица измерения");
    const unitPrice = positiveMoney(input.unitPriceKopecks, "Цена за единицу");
    const amount = roundManualPurchaseAmount(input.quantity, unitPrice);
    positiveMoney(amount, "Сумма");

    return {
      type: input.type,
      title,
      amount,
      quantity: input.quantity.replace(",", "."),
      unit,
      unitPrice,
      documentPhotoFileId: null,
      comment
    };
  }

  if (input.type === "document_purchase") {
    return {
      type: input.type,
      title,
      amount: positiveMoney(input.amountKopecks, "Сумма"),
      quantity: null,
      unit: null,
      unitPrice: null,
      documentPhotoFileId: input.documentPhotoFileId?.trim() || null,
      comment
    };
  }

  return {
    type: input.type,
    title,
    amount: positiveMoney(input.amountKopecks, "Сумма"),
    quantity: null,
    unit: null,
    unitPrice: null,
    documentPhotoFileId: null,
    comment
  };
}

