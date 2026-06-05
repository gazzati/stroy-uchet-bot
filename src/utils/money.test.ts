import { describe, expect, it } from "vitest";
import { formatMoney, parseMoneyToKopecks, roundManualPurchaseAmount } from "./money.js";

describe("money utils", () => {
  it("parses rubles and kopecks", () => {
    expect(parseMoneyToKopecks("1250")).toBe(125000n);
    expect(parseMoneyToKopecks("1250,50")).toBe(125050n);
    expect(parseMoneyToKopecks("1250.05")).toBe(125005n);
  });

  it("formats kopecks", () => {
    expect(formatMoney(125000n)).toBe("1250 ₽");
    expect(formatMoney(125050n)).toBe("1250,50 ₽");
    expect(formatMoney(-50n)).toBe("-0,50 ₽");
  });

  it("rounds manual purchase amount to nearest kopeck", () => {
    expect(roundManualPurchaseAmount("1.333", 999n)).toBe(1332n);
    expect(roundManualPurchaseAmount("1.333", 1000n)).toBe(1333n);
  });
});

