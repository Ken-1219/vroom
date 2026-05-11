import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { tripService } from "@/services/trip";
import { startTripSchema } from "@vroom/validators";
import { ApiError, errorResponse } from "@/lib/api-error";
import { registerEventHandlers } from "@/lib/event-handlers";
import { resolveUserId } from "@/lib/resolve-user-id";

registerEventHandlers();

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse(new ApiError(401, "UNAUTHORIZED", "Unauthorized"));
  }

  try {
    const body = await request.json();
    const input = startTripSchema.parse(body);
    const userId = await resolveUserId(session.user.id, session.user.email);
    const trip = await tripService.start(input, userId);
    return NextResponse.json(trip, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
