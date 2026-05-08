import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { notificationService } from "@/services/notification";
import { ApiError, errorResponse } from "@/lib/api-error";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse(new ApiError(401, "UNAUTHORIZED", "Unauthorized"));
  }

  try {
    const limit = Number(request.nextUrl.searchParams.get("limit") ?? "20");
    const offset = Number(request.nextUrl.searchParams.get("offset") ?? "0");

    const result = await notificationService.getByUser(
      session.user.id,
      Math.min(limit, 50),
      offset
    );

    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
