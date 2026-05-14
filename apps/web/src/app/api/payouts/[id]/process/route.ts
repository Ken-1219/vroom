import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { payoutService } from "@/services/payout";
import { ApiError, errorResponse } from "@/lib/api-error";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse(new ApiError(401, "UNAUTHORIZED", "Unauthorized"));
  }

  if (session.user.role !== "admin") {
    return errorResponse(
      new ApiError(403, "FORBIDDEN", "Admin access required")
    );
  }

  const { id } = await params;

  try {
    const body = await request.json().catch(() => ({}));
    const fundAccountId = (body as Record<string, unknown>)
      .fundAccountId as string | undefined;

    const payout = await payoutService.processPayout(id, fundAccountId);
    return NextResponse.json(payout);
  } catch (error) {
    return errorResponse(error);
  }
}
