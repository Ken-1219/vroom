import * as Sentry from "@sentry/nextjs";

type LogLevel = "info" | "warn" | "error" | "debug";

const isDev = process.env.NODE_ENV === "development";
const sentryEnabled = Boolean(
  process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN
);

function formatLog(
  level: LogLevel,
  message: string,
  extra: Record<string, unknown>
): string {
  const entry = {
    level,
    message,
    ...extra,
    timestamp: new Date().toISOString(),
  };
  return JSON.stringify(entry);
}

function log(
  level: LogLevel,
  message: string,
  extra: Record<string, unknown> = {}
) {
  const json = formatLog(level, message, extra);
  const consoleFn =
    level === "error"
      ? console.error
      : level === "warn"
        ? console.warn
        : level === "debug"
          ? console.debug
          : console.log;

  consoleFn(json);

  if (isDev) {
    const extraKeys = Object.keys(extra);
    const extraStr =
      extraKeys.length > 0
        ? " " +
          extraKeys.map((k) => `${k}=${JSON.stringify(extra[k])}`).join(" ")
        : "";
    consoleFn(`[${level.toUpperCase()}] ${message}${extraStr}`);
  }

  // Send errors to Sentry when available
  if (level === "error" && sentryEnabled) {
    const errorObj = extra?.error;
    if (errorObj instanceof Error) {
      Sentry.captureException(errorObj, {
        extra: { ...extra, logMessage: message },
      });
    } else if (errorObj === undefined) {
      // Only capture as message if there's no error field at all —
      // when error is a string, the caller is expected to handle Sentry directly
      Sentry.captureMessage(message, {
        level: "error",
        extra,
      });
    }
  }
}

export const logger = {
  info: (message: string, extra?: Record<string, unknown>) =>
    log("info", message, extra),
  warn: (message: string, extra?: Record<string, unknown>) =>
    log("warn", message, extra),
  error: (message: string, extra?: Record<string, unknown>) =>
    log("error", message, extra),
  debug: (message: string, extra?: Record<string, unknown>) =>
    log("debug", message, extra),
};
