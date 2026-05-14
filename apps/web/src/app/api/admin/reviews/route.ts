import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { reviewService } from "@/services/review";
import { ApiError, errorResponse } from "@/lib/api-error";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return errorResponse(new ApiError(403, "FORBIDDEN", "Admin access required"));
  }

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status") as
    | "published"
    | "hidden"
    | "flagged"
    | null;
  const limit = Math.min(
    parseInt(searchParams.get("limit") ?? "50"),
    100
  );

  try {
    const rows = await reviewService.getAllForModeration(
      status ?? undefined,
      limit
    );
    return NextResponse.json({ reviews: rows });
  } catch (error) {
    return errorResponse(error);
  }
}
