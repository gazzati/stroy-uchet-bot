import { toCsv } from "../utils/csv.js";
import type { ExpenseReportRow } from "./reports.js";

const HEADER = [
  "Дата",
  "Объект",
  "Тип",
  "Наименование",
  "Количество",
  "Ед.изм.",
  "Цена",
  "Сумма",
  "Автор",
  "Комментарий"
];

export function expenseRowsToCsv(rows: ExpenseReportRow[], timezone: string): string {
  const formatter = new Intl.DateTimeFormat("ru-RU", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });

  return toCsv([
    HEADER,
    ...rows.map((row) => [
      formatter.format(row.date),
      row.object,
      row.type,
      row.title,
      row.quantity ?? "",
      row.unit ?? "",
      row.unitPrice ?? "",
      row.amount,
      row.author,
      row.comment ?? ""
    ])
  ]);
}

