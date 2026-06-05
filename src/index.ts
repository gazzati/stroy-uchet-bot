import { loadConfig } from "./config/index.js";
import { createDb } from "./db/index.js";
import { createServices } from "./services/index.js";
import { createBot } from "./telegram/bot.js";
import { logger } from "./utils/logger.js";

async function main() {
  const config = loadConfig();
  const db = createDb(config.databaseUrl);
  const services = createServices(db);

  await services.users.bootstrapAdmins(config.adminTelegramIds);

  const bot = createBot(config, services);

  const shutdown = (signal: string) => {
    logger.info({ signal }, "Shutting down");
    bot.stop();
    void db.destroy();
  };
  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));

  await bot.start({
    onStart: (info) => logger.info({ username: info.username, mode: config.botMode }, "Bot started"),
  });
}

main().catch((error) => {
  logger.error({ err: error }, "Fatal error during startup");
  process.exitCode = 1;
});

