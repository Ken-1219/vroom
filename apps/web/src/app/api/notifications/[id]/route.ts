import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { notificationService } from "@/services/notification";
import { ApiError, errorResponse } from "@/lib/api-error";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse(new ApiError(401, "UNAUTHORIZED", "Unauthorized"));
  }

  try {
    const { id } = await params;
    await notificationService.markRead(id, session.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
