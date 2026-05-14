import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate:
      process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Filter out expected errors (4xx) — only capture unexpected 5xx
    beforeSend(event) {
      return event;
    },
  });
}
