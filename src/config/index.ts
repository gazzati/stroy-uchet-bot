import "dotenv/config";
import { z } from "zod";

const baseEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  ADMIN_TELEGRAM_IDS: z.string().default(""),
  TZ: z.string().default("Europe/Moscow")
});

const appEnvSchema = baseEnvSchema.extend({
  BOT_TOKEN: z.string().min(1),
  BOT_MODE: z.enum(["polling"]).default("polling")
});

export type AppConfig = {
  botToken: string;
  databaseUrl: string;
  adminTelegramIds: bigint[];
  timezone: string;
  botMode: "polling";
};

export type DatabaseConfig = {
  databaseUrl: string;
  adminTelegramIds: bigint[];
  timezone: string;
};

function parseTelegramIds(value: string): bigint[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      if (!/^\d+$/.test(item)) {
        throw new Error(`Invalid Telegram ID in ADMIN_TELEGRAM_IDS: ${item}`);
      }
      return BigInt(item);
    });
}

export function loadConfig(): AppConfig {
  const env = appEnvSchema.parse(process.env);

  return {
    botToken: env.BOT_TOKEN,
    databaseUrl: env.DATABASE_URL,
    adminTelegramIds: parseTelegramIds(env.ADMIN_TELEGRAM_IDS),
    timezone: env.TZ,
    botMode: env.BOT_MODE
  };
}

export function loadDatabaseConfig(): DatabaseConfig {
  const env = baseEnvSchema.parse(process.env);

  return {
    databaseUrl: env.DATABASE_URL,
    adminTelegramIds: parseTelegramIds(env.ADMIN_TELEGRAM_IDS),
    timezone: env.TZ
  };
}
