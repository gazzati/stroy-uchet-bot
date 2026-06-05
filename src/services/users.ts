import { sql } from "kysely";
import type { AppDb } from "../db/index.js";
import type { ConstructionObject, User, UserRole } from "../db/schema.js";
import { NotFoundError, ValidationError } from "../domain/errors.js";

export type CreateForemanInput = {
  telegramId: bigint;
  name: string;
  username?: string | null;
};

export type ForemanWithAssignments = User & { active_assignments: number };

export class UserService {
  constructor(private readonly db: AppDb) {}

  async bootstrapAdmins(telegramIds: bigint[]): Promise<void> {
    for (const telegramId of telegramIds) {
      const existing = await this.findByTelegramId(telegramId, { includeBlocked: true });

      if (!existing) {
        await this.db
          .insertInto("users")
          .values({
            telegram_id: telegramId,
            role: "admin",
            name: `Admin ${telegramId.toString()}`,
            username: null
          })
          .execute();
        continue;
      }

      await this.db
        .updateTable("users")
        .set({
          role: "admin",
          is_blocked: false,
          deleted_at: null,
          updated_at: new Date()
        })
        .where("id", "=", existing.id)
        .execute();
    }
  }

  async findByTelegramId(
    telegramId: bigint,
    options: { includeBlocked?: boolean } = {}
  ): Promise<User | null> {
    let query = this.db
      .selectFrom("users")
      .selectAll()
      .where("telegram_id", "=", telegramId.toString())
      .where("deleted_at", "is", null);

    if (!options.includeBlocked) {
      query = query.where("is_blocked", "=", false);
    }

    return (await query.executeTakeFirst()) ?? null;
  }

  async requireUser(id: string): Promise<User> {
    const user = await this.db
      .selectFrom("users")
      .selectAll()
      .where("id", "=", id)
      .where("deleted_at", "is", null)
      .executeTakeFirst();

    if (!user) {
      throw new NotFoundError("Пользователь не найден");
    }

    return user;
  }

  async createForeman(input: CreateForemanInput): Promise<User> {
    const name = input.name.trim();
    if (!name) {
      throw new ValidationError("Имя бригадира не может быть пустым");
    }

    const [user] = await this.db
      .insertInto("users")
      .values({
        telegram_id: input.telegramId,
        role: "foreman",
        name,
        username: input.username ?? null
      })
      .returningAll()
      .execute();

    return user;
  }

  async listForemen(): Promise<User[]> {
    return this.db
      .selectFrom("users")
      .selectAll()
      .where("role", "=", "foreman")
      .where("deleted_at", "is", null)
      .orderBy("name")
      .execute();
  }

  async listForemenWithAssignments(): Promise<ForemanWithAssignments[]> {
    const rows = await this.db
      .selectFrom("users")
      .leftJoin("object_foremen", (join) =>
        join.onRef("object_foremen.foreman_id", "=", "users.id").on("object_foremen.deleted_at", "is", null)
      )
      .selectAll("users")
      .select(sql<string>`count(object_foremen.id)`.as("active_assignments"))
      .where("users.role", "=", "foreman")
      .where("users.deleted_at", "is", null)
      .groupBy("users.id")
      .orderBy("users.name")
      .execute();

    return rows.map((row) => ({ ...row, active_assignments: Number(row.active_assignments) }));
  }

  async listObjectsForForeman(foremanId: string): Promise<ConstructionObject[]> {
    return this.db
      .selectFrom("objects")
      .innerJoin("object_foremen", "object_foremen.object_id", "objects.id")
      .selectAll("objects")
      .where("object_foremen.foreman_id", "=", foremanId)
      .where("object_foremen.deleted_at", "is", null)
      .where("objects.status", "=", "active")
      .orderBy("objects.created_at", "desc")
      .execute();
  }

  async renameForeman(userId: string, name: string): Promise<void> {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new ValidationError("Имя бригадира не может быть пустым");
    }
    await this.db
      .updateTable("users")
      .set({ name: trimmed, updated_at: new Date() })
      .where("id", "=", userId)
      .where("role", "=", "foreman" satisfies UserRole)
      .where("deleted_at", "is", null)
      .execute();
  }

  async blockUser(userId: string, blocked: boolean): Promise<void> {
    await this.db
      .updateTable("users")
      .set({ is_blocked: blocked, updated_at: new Date() })
      .where("id", "=", userId)
      .execute();
  }

  async softDeleteForeman(userId: string): Promise<void> {
    const now = new Date();
    await this.db.transaction().execute(async (trx) => {
      await trx
        .updateTable("object_foremen")
        .set({ deleted_at: now })
        .where("foreman_id", "=", userId)
        .where("deleted_at", "is", null)
        .execute();

      await trx
        .updateTable("users")
        .set({ deleted_at: now, updated_at: now })
        .where("id", "=", userId)
        .where("role", "=", "foreman" satisfies UserRole)
        .execute();
    });
  }
}
