import { sql } from "kysely";
import type { AppDb } from "../db/index.js";
import type { ConstructionObject, User } from "../db/schema.js";
import { AccessDeniedError, NotFoundError, ValidationError } from "../domain/errors.js";

export type ObjectWithBudget = ConstructionObject & {
  total_expenses: string;
  balance: string;
};

export class ObjectService {
  constructor(private readonly db: AppDb) {}

  async createObject(input: { title: string; budgetAmount: bigint }): Promise<ConstructionObject> {
    const title = input.title.trim();
    if (!title) {
      throw new ValidationError("Название объекта не может быть пустым");
    }
    if (input.budgetAmount < 0n) {
      throw new ValidationError("Бюджет не может быть отрицательным");
    }

    const [object] = await this.db
      .insertInto("objects")
      .values({
        title,
        budget_amount: input.budgetAmount
      })
      .returningAll()
      .execute();

    return object;
  }

  async listActiveObjectsForUser(user: User): Promise<ObjectWithBudget[]> {
    if (user.role === "admin") {
      return this.listObjectsByStatus("active");
    }

    return this.db
      .selectFrom("objects")
      .innerJoin("object_foremen", "object_foremen.object_id", "objects.id")
      .leftJoin("expenses", (join) =>
        join.onRef("expenses.object_id", "=", "objects.id").on("expenses.deleted_at", "is", null)
      )
      .selectAll("objects")
      .select([
        sql<string>`coalesce(sum(expenses.amount), 0)::text`.as("total_expenses"),
        sql<string>`(objects.budget_amount - coalesce(sum(expenses.amount), 0))::text`.as("balance")
      ])
      .where("objects.status", "=", "active")
      .where("object_foremen.foreman_id", "=", user.id)
      .where("object_foremen.deleted_at", "is", null)
      .groupBy("objects.id")
      .orderBy("objects.created_at", "desc")
      .execute();
  }

  async listObjectsByStatus(status: "active" | "archived"): Promise<ObjectWithBudget[]> {
    return this.db
      .selectFrom("objects")
      .leftJoin("expenses", (join) =>
        join.onRef("expenses.object_id", "=", "objects.id").on("expenses.deleted_at", "is", null)
      )
      .selectAll("objects")
      .select([
        sql<string>`coalesce(sum(expenses.amount), 0)::text`.as("total_expenses"),
        sql<string>`(objects.budget_amount - coalesce(sum(expenses.amount), 0))::text`.as("balance")
      ])
      .where("objects.status", "=", status)
      .groupBy("objects.id")
      .orderBy("objects.created_at", "desc")
      .execute();
  }

  async getObjectWithBudget(objectId: string): Promise<ObjectWithBudget> {
    const object = await this.db
      .selectFrom("objects")
      .leftJoin("expenses", (join) =>
        join.onRef("expenses.object_id", "=", "objects.id").on("expenses.deleted_at", "is", null)
      )
      .selectAll("objects")
      .select([
        sql<string>`coalesce(sum(expenses.amount), 0)::text`.as("total_expenses"),
        sql<string>`(objects.budget_amount - coalesce(sum(expenses.amount), 0))::text`.as("balance")
      ])
      .where("objects.id", "=", objectId)
      .groupBy("objects.id")
      .executeTakeFirst();

    if (!object) {
      throw new NotFoundError("Объект не найден");
    }

    return object;
  }

  async requireObjectForExpense(objectId: string, user: User): Promise<ConstructionObject> {
    const object = await this.db
      .selectFrom("objects")
      .selectAll()
      .where("id", "=", objectId)
      .executeTakeFirst();

    if (!object) {
      throw new NotFoundError("Объект не найден");
    }
    if (object.status !== "active") {
      throw new ValidationError("По архивному объекту нельзя добавить расход");
    }
    if (user.role === "admin") {
      return object;
    }

    const assignment = await this.db
      .selectFrom("object_foremen")
      .select("id")
      .where("object_id", "=", objectId)
      .where("foreman_id", "=", user.id)
      .where("deleted_at", "is", null)
      .executeTakeFirst();

    if (!assignment) {
      throw new AccessDeniedError("Объект не назначен бригадиру");
    }

    return object;
  }

  async renameObject(objectId: string, title: string): Promise<void> {
    const trimmed = title.trim();
    if (!trimmed) {
      throw new ValidationError("Название объекта не может быть пустым");
    }
    await this.db
      .updateTable("objects")
      .set({ title: trimmed, updated_at: new Date() })
      .where("id", "=", objectId)
      .execute();
  }

  async updateBudget(objectId: string, budgetAmount: bigint): Promise<void> {
    if (budgetAmount < 0n) {
      throw new ValidationError("Бюджет не может быть отрицательным");
    }
    await this.db
      .updateTable("objects")
      .set({ budget_amount: budgetAmount, updated_at: new Date() })
      .where("id", "=", objectId)
      .execute();
  }

  async archiveObject(objectId: string): Promise<void> {
    await this.db
      .updateTable("objects")
      .set({ status: "archived", archived_at: new Date(), updated_at: new Date() })
      .where("id", "=", objectId)
      .where("status", "=", "active")
      .execute();
  }

  async restoreObject(objectId: string): Promise<void> {
    await this.db
      .updateTable("objects")
      .set({ status: "active", archived_at: null, updated_at: new Date() })
      .where("id", "=", objectId)
      .where("status", "=", "archived")
      .execute();
  }

  async assignForeman(objectId: string, foremanId: string): Promise<void> {
    await this.db
      .insertInto("object_foremen")
      .values({
        object_id: objectId,
        foreman_id: foremanId
      })
      .onConflict((oc) => oc.columns(["object_id", "foreman_id"]).where("deleted_at", "is", null).doNothing())
      .execute();
  }

  async detachForeman(objectId: string, foremanId: string): Promise<void> {
    await this.db
      .updateTable("object_foremen")
      .set({ deleted_at: new Date() })
      .where("object_id", "=", objectId)
      .where("foreman_id", "=", foremanId)
      .where("deleted_at", "is", null)
      .execute();
  }

  async listForemenForObject(objectId: string): Promise<User[]> {
    return this.db
      .selectFrom("users")
      .innerJoin("object_foremen", "object_foremen.foreman_id", "users.id")
      .selectAll("users")
      .where("object_foremen.object_id", "=", objectId)
      .where("object_foremen.deleted_at", "is", null)
      .where("users.deleted_at", "is", null)
      .orderBy("users.name")
      .execute();
  }

  async listUnassignedForemen(objectId: string): Promise<User[]> {
    return this.db
      .selectFrom("users")
      .selectAll("users")
      .where("users.role", "=", "foreman")
      .where("users.deleted_at", "is", null)
      .where("users.is_blocked", "=", false)
      .where((eb) =>
        eb.not(
          eb.exists(
            eb
              .selectFrom("object_foremen")
              .select("object_foremen.id")
              .whereRef("object_foremen.foreman_id", "=", "users.id")
              .where("object_foremen.object_id", "=", objectId)
              .where("object_foremen.deleted_at", "is", null)
          )
        )
      )
      .orderBy("users.name")
      .execute();
  }
}
