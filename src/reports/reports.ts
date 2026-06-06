import type { AppDb } from "../db/index.js";
import { formatMoney } from "../utils/money.js";

export type ExpenseReportRow = {
  date: Date;
  object: string;
  type: string;
  title: string;
  quantity: string | null;
  unit: string | null;
  unitPrice: string | null;
  amount: string;
  author: string;
  comment: string | null;
};

export class ReportService {
  constructor(private readonly db: AppDb) {}

  async expensesByObject(objectId: string): Promise<ExpenseReportRow[]> {
    return this.expenseRows((query) => query.where("expenses.object_id", "=", objectId));
  }

  private async expenseRows(
    filter: (
      query: ReturnType<ReportService["baseExpenseQuery"]>
    ) => ReturnType<ReportService["baseExpenseQuery"]>
  ): Promise<ExpenseReportRow[]> {
    const rows = await filter(this.baseExpenseQuery()).orderBy("expenses.created_at", "desc").execute();

    return rows.map((row) => ({
      date: row.created_at,
      object: row.object_title,
      type: translateExpenseType(row.type),
      title: row.title,
      quantity: row.quantity,
      unit: row.unit,
      unitPrice: row.unit_price == null ? null : formatMoney(row.unit_price),
      amount: formatMoney(row.amount),
      author: row.author_name,
      comment: row.comment
    }));
  }

  private baseExpenseQuery() {
    return this.db
      .selectFrom("expenses")
      .innerJoin("objects", "objects.id", "expenses.object_id")
      .innerJoin("users", "users.id", "expenses.author_id")
      .select([
        "expenses.created_at",
        "expenses.type",
        "expenses.title",
        "expenses.quantity",
        "expenses.unit",
        "expenses.unit_price",
        "expenses.amount",
        "expenses.comment",
        "objects.title as object_title",
        "users.name as author_name"
      ])
      .where("expenses.deleted_at", "is", null);
  }
}

export function translateExpenseType(type: string): string {
  switch (type) {
    case "manual_purchase":
      return "Ручная закупка";
    case "document_purchase":
      return "Чек / накладная";
    case "bank_transfer":
      return "Безналичная операция";
    case "service_payment":
      return "Оплата услуг";
    default:
      return type;
  }
}
