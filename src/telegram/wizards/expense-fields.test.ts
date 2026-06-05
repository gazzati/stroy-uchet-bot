import { describe, expect, it } from "vitest";
import { normalizeExpenseInput } from "../../domain/expense.js";
import { buildExpenseInput, nextStep } from "./expense-fields.js";

describe("expense wizard field flow", () => {
  it("orders manual purchase steps", () => {
    expect(nextStep("manual_purchase", "title")).toBe("quantity");
    expect(nextStep("manual_purchase", "quantity")).toBe("unit");
    expect(nextStep("manual_purchase", "unit")).toBe("unit_price");
    expect(nextStep("manual_purchase", "unit_price")).toBe("comment");
    expect(nextStep("manual_purchase", "comment")).toBe("confirm");
  });

  it("orders document purchase steps (with photo)", () => {
    expect(nextStep("document_purchase", "title")).toBe("photo");
    expect(nextStep("document_purchase", "photo")).toBe("amount");
    expect(nextStep("document_purchase", "amount")).toBe("comment");
  });

  it("orders simple expense steps (bank/service)", () => {
    expect(nextStep("bank_transfer", "title")).toBe("amount");
    expect(nextStep("service_payment", "title")).toBe("amount");
  });

  it("builds a manual purchase input that normalizes", () => {
    const input = buildExpenseInput("manual_purchase", {
      title: "Цемент",
      quantity: "10",
      unit: "меш",
      unitPriceKopecks: "35000"
    });
    const normalized = normalizeExpenseInput(input);
    expect(normalized.type).toBe("manual_purchase");
    expect(normalized.amount).toBe(350000n);
    expect(normalized.unit).toBe("меш");
  });

  it("builds a document purchase input carrying the photo id", () => {
    const input = buildExpenseInput("document_purchase", {
      title: "Накладная",
      amountKopecks: "120000",
      documentPhotoFileId: "file123"
    });
    expect(input).toMatchObject({ type: "document_purchase", documentPhotoFileId: "file123" });
    expect(normalizeExpenseInput(input).amount).toBe(120000n);
  });

  it("throws when a manual purchase is missing fields", () => {
    expect(() => buildExpenseInput("manual_purchase", { title: "X" })).toThrow();
  });

  it("throws when a simple expense has no amount", () => {
    expect(() => buildExpenseInput("bank_transfer", { title: "X" })).toThrow();
  });
});
