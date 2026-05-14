import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { reviewService } from "@/services/review";
import { ApiError, errorResponse } from "@/lib/api-error";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return errorResponse(new ApiError(403, "FORBIDDEN", "Admin access required"));
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { action, reason } = body as {
      action: "flag" | "hide" | "publish";
      reason?: string;
    };

    if (!action || !["flag", "hide", "publish"].includes(action)) {
      return errorResponse(
        new ApiError(400, "BAD_REQUEST", "action must be one of: flag, hide, publish")
      );
    }

    let review;
    switch (action) {
      case "flag":
        review = await reviewService.flagReview(id, reason ?? "Flagged by admin");
        break;
      case "hide":
        review = await reviewService.hideReview(id, reason ?? "Hidden by admin");
        break;
      case "publish":
        review = await reviewService.publishReview(id);
        break;
    }

    return NextResponse.json(review);
  } catch (error) {
    if (error instanceof Error && error.message === "Review not found") {
      return errorResponse(new ApiError(404, "NOT_FOUND", "Review not found"));
    }
    return errorResponse(error);
  }
}
