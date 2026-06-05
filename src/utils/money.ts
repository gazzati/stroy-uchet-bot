const MONEY_INPUT_RE = /^\d+(?:[,.]\d{1,2})?$/;

export function parseMoneyToKopecks(input: string): bigint {
  const value = input.trim().replace(/\s+/g, "").replace(",", ".");

  if (!MONEY_INPUT_RE.test(value)) {
    throw new Error("Введите сумму в формате 1250 или 1250,50");
  }

  const [rubles, kopecks = ""] = value.split(".");
  return BigInt(rubles) * 100n + BigInt(kopecks.padEnd(2, "0"));
}

export function formatMoney(kopecks: bigint | string | number): string {
  const value = BigInt(kopecks);
  const sign = value < 0n ? "-" : "";
  const absolute = value < 0n ? -value : value;
  const rubles = absolute / 100n;
  const rest = absolute % 100n;

  if (rest === 0n) {
    return `${sign}${rubles.toString()} ₽`;
  }

  return `${sign}${rubles.toString()},${rest.toString().padStart(2, "0")} ₽`;
}

export function roundManualPurchaseAmount(quantity: string | number, unitPriceKopecks: bigint): bigint {
  const normalized = String(quantity).replace(",", ".");

  if (!/^\d+(?:\.\d{1,3})?$/.test(normalized)) {
    throw new Error("Количество должно быть числом с точностью до 3 знаков");
  }

  const [integer, fraction = ""] = normalized.split(".");
  const scaledQuantity = BigInt(integer) * 1000n + BigInt(fraction.padEnd(3, "0"));
  return (scaledQuantity * unitPriceKopecks + 500n) / 1000n;
}

