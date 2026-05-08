import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { notificationService } from "@/services/notification";
import { ApiError, errorResponse } from "@/lib/api-error";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse(new ApiError(401, "UNAUTHORIZED", "Unauthorized"));
  }

  try {
    await notificationService.markAllRead(session.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
