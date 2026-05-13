import { ZodError } from "zod";
import { logger } from "@/lib/logger";

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
  }
}

export function errorResponse(error: unknown): Response {
  if (error instanceof ApiError) {
    return Response.json(
      {
        error: {
          code: error.code,
          message: error.message,
          ...(error.details && { details: error.details }),
        },
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof ZodError) {
    return Response.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request data",
          details: error.flatten(),
        },
      },
      { status: 400 }
    );
  }

  logger.error("Unhandled error", { error: error instanceof Error ? error.message : String(error) });

  // Determine a safe, user-facing message.
  // Raw DB/Drizzle errors start with "Failed query:" — never expose these to clients.
  let safeMessage = "An unexpected error occurred";
  if (error instanceof Error) {
    const msg = error.message;
    if (
      msg.startsWith("Failed query:") ||
      msg.includes("violates") ||       // Postgres constraint errors
      msg.includes("duplicate key") ||
      msg.includes("foreign key")
    ) {
      // Log full error on server, return generic message to client
      safeMessage = "An unexpected error occurred. Please try again.";
    } else {
      // App-level errors (e.g. "This vehicle is already booked") are safe to forward
      safeMessage = msg;
    }
  }

  return Response.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: safeMessage,
      },
    },
    { status: 500 }
  );
}
