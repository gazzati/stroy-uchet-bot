import type { AppDb } from "../db/index.js";
import type { Expense, User } from "../db/schema.js";
import { normalizeExpenseInput, type ExpenseInput } from "../domain/expense.js";
import { AccessDeniedError, NotFoundError, ValidationError } from "../domain/errors.js";
import { ObjectService } from "./objects.js";

export class ExpenseService {
  private readonly objectService: ObjectService;

  constructor(private readonly db: AppDb) {
    this.objectService = new ObjectService(db);
  }

  async createExpense(user: User, objectId: string, input: ExpenseInput): Promise<Expense> {
    await this.objectService.requireObjectForExpense(objectId, user);
    const normalized = normalizeExpenseInput(input);

    const [expense] = await this.db
      .insertInto("expenses")
      .values({
        object_id: objectId,
        author_id: user.id,
        type: normalized.type,
        title: normalized.title,
        amount: normalized.amount,
        quantity: normalized.quantity,
        unit: normalized.unit,
        unit_price: normalized.unitPrice,
        document_photo_file_id: normalized.documentPhotoFileId,
        comment: normalized.comment
      })
      .returningAll()
      .execute();

    return expense;
  }

  async listObjectExpenses(user: User, objectId: string): Promise<Expense[]> {
    if (user.role !== "admin") {
      const assignment = await this.db
        .selectFrom("object_foremen")
        .select("id")
        .where("object_id", "=", objectId)
        .where("foreman_id", "=", user.id)
        .where("deleted_at", "is", null)
        .executeTakeFirst();

      if (!assignment) {
        throw new AccessDeniedError();
      }
    }

    return this.db
      .selectFrom("expenses")
      .selectAll()
      .where("object_id", "=", objectId)
      .where("deleted_at", "is", null)
      .orderBy("created_at", "desc")
      .execute();
  }

  async listUserExpenses(user: User, targetUserId?: string): Promise<Expense[]> {
    const authorId = user.role === "admin" && targetUserId ? targetUserId : user.id;

    return this.db
      .selectFrom("expenses")
      .selectAll()
      .where("author_id", "=", authorId)
      .where("deleted_at", "is", null)
      .orderBy("created_at", "desc")
      .execute();
  }

  async updateExpense(user: User, expenseId: string, input: ExpenseInput): Promise<Expense> {
    const existing = await this.requireEditableExpense(user, expenseId);
    const normalized = normalizeExpenseInput(input);

    const [expense] = await this.db
      .updateTable("expenses")
      .set({
        type: normalized.type,
        title: normalized.title,
        amount: normalized.amount,
        quantity: normalized.quantity,
        unit: normalized.unit,
        unit_price: normalized.unitPrice,
        document_photo_file_id: normalized.documentPhotoFileId,
        comment: normalized.comment,
        updated_at: new Date()
      })
      .where("id", "=", existing.id)
      .returningAll()
      .execute();

    return expense;
  }

  async softDeleteExpense(user: User, expenseId: string): Promise<void> {
    const existing = await this.requireEditableExpense(user, expenseId);

    await this.db
      .updateTable("expenses")
      .set({ deleted_at: new Date(), updated_at: new Date() })
      .where("id", "=", existing.id)
      .execute();
  }

  async requireExpense(expenseId: string): Promise<Expense> {
    const expense = await this.db
      .selectFrom("expenses")
      .selectAll()
      .where("id", "=", expenseId)
      .where("deleted_at", "is", null)
      .executeTakeFirst();

    if (!expense) {
      throw new NotFoundError("Расход не найден");
    }

    return expense;
  }

  private async requireEditableExpense(user: User, expenseId: string): Promise<Expense> {
    const expense = await this.requireExpense(expenseId);

    if (user.role === "admin") {
      return expense;
    }

    if (expense.author_id !== user.id) {
      throw new AccessDeniedError("Можно менять только свои расходы");
    }

    const object = await this.db
      .selectFrom("objects")
      .select(["status"])
      .where("id", "=", expense.object_id)
      .executeTakeFirst();

    if (!object) {
      throw new ValidationError("Объект расхода не найден");
    }
    if (object.status !== "active") {
      throw new AccessDeniedError("Расходы архивного объекта нельзя менять бригадиру");
    }

    return expense;
  }
}

