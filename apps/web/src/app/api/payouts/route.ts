import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { payoutService } from "@/services/payout";
import { requestPayoutSchema } from "@vroom/validators";
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
    const hostId = await resolveUserId(session.user.id, session.user.email);
    const payoutsList = await payoutService.getByHost(hostId);
    return NextResponse.json(payoutsList);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse(new ApiError(401, "UNAUTHORIZED", "Unauthorized"));
  }

  if (session.user.role !== "host" && session.user.role !== "admin") {
    return errorResponse(new ApiError(403, "FORBIDDEN", "Host access required"));
  }

  try {
    const body = await request.json();
    const parsed = requestPayoutSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error);
    }

    const hostId = await resolveUserId(session.user.id, session.user.email);
    const payout = await payoutService.createPayout(
      hostId,
      new Date(parsed.data.periodStart),
      new Date(parsed.data.periodEnd)
    );

    return NextResponse.json(payout, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
