import { ZodError } from "zod";

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

  console.error("Unhandled error:", error);
  return Response.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message:
          error instanceof Error ? error.message : "An unexpected error occurred",
      },
    },
    { status: 500 }
  );
}
