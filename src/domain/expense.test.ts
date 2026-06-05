import { describe, expect, it } from "vitest";
import { normalizeExpenseInput } from "./expense.js";

describe("normalizeExpenseInput", () => {
  it("normalizes manual purchase and forbids document photo shape implicitly", () => {
    const expense = normalizeExpenseInput({
      type: "manual_purchase",
      title: "Цемент",
      quantity: "2.5",
      unit: "меш",
      unitPriceKopecks: 50000n,
      comment: ""
    });

    expect(expense).toMatchObject({
      type: "manual_purchase",
      title: "Цемент",
      amount: 125000n,
      quantity: "2.5",
      unit: "меш",
      unitPrice: 50000n,
      documentPhotoFileId: null,
      comment: null
    });
  });

  it("keeps Telegram file_id only for document purchase", () => {
    const expense = normalizeExpenseInput({
      type: "document_purchase",
      title: "Накладная",
      amountKopecks: 100000n,
      documentPhotoFileId: "file-id",
      comment: "крупная закупка"
    });

    expect(expense.documentPhotoFileId).toBe("file-id");
    expect(expense.quantity).toBeNull();
    expect(expense.unit).toBeNull();
    expect(expense.unitPrice).toBeNull();
  });
});

