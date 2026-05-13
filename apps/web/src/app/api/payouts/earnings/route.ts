import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { payoutService } from "@/services/payout";
import { ApiError, errorResponse } from "@/lib/api-error";
import { resolveUserId } from "@/lib/resolve-user-id";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse(new ApiError(401, "UNAUTHORIZED", "Unauthorized"));
  }

  if (session.user.role !== "host" && session.user.role !== "admin") {
    return errorResponse(new ApiError(403, "FORBIDDEN", "Host access required"));
  }

  try {
    const { searchParams } = request.nextUrl;

    const now = new Date();
    const defaultStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const periodStart = searchParams.get("periodStart")
      ? new Date(searchParams.get("periodStart")!)
      : defaultStart;
    const periodEnd = searchParams.get("periodEnd")
      ? new Date(searchParams.get("periodEnd")!)
      : now;

    const hostId = await resolveUserId(session.user.id, session.user.email);
    const earnings = await payoutService.calculateHostEarnings(
      hostId,
      periodStart,
      periodEnd
    );

    return NextResponse.json(earnings);
  } catch (error) {
    return errorResponse(error);
  }
}
