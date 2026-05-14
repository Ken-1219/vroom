import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { reviewService } from "@/services/review";
import { ApiError, errorResponse } from "@/lib/api-error";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse(new ApiError(401, "UNAUTHORIZED", "Unauthorized"));
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { reason } = body as { reason: string };

    if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
      return errorResponse(
        new ApiError(400, "BAD_REQUEST", "reason is required")
      );
    }

    const review = await reviewService.flagReview(id, reason.trim());
    return NextResponse.json(review);
  } catch (error) {
    if (error instanceof Error && error.message === "Review not found") {
      return errorResponse(new ApiError(404, "NOT_FOUND", "Review not found"));
    }
    return errorResponse(error);
  }
}
