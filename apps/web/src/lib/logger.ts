type LogLevel = "info" | "warn" | "error" | "debug";

const isDev = process.env.NODE_ENV === "development";

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
