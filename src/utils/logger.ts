import pino, { stdSerializers } from "pino";

const isProduction = process.env.NODE_ENV === "production";
const level = process.env.LOG_LEVEL ?? (isProduction ? "info" : "debug");

export const logger = pino({
  level,
  // Pretty-print in development, structured JSON in production.
  transport: isProduction
    ? undefined
    : {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:HH:MM:ss",
          ignore: "pid,hostname",
          singleLine: true
        }
      },
  serializers: {
    err: stdSerializers.err
  }
});

// Telegram IDs are bigint; JSON.stringify throws on them, so teach pino to render them as strings.
(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function () {
  return this.toString();
};

export type Logger = typeof logger;
