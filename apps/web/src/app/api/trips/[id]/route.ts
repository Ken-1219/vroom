import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { tripService } from "@/services/trip";
import { bookingService } from "@/services/booking";
import { endTripSchema } from "@vroom/validators";
import { ApiError, errorResponse } from "@/lib/api-error";
import { registerEventHandlers } from "@/lib/event-handlers";
import { resolveUserId } from "@/lib/resolve-user-id";

registerEventHandlers();

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse(new ApiError(401, "UNAUTHORIZED", "Unauthorized"));
  }

  try {
    const { id } = await params;
    const trip = await tripService.getById(id);
    if (!trip) {
      return errorResponse(new ApiError(404, "NOT_FOUND", "Trip not found"));
    }

    const userId = await resolveUserId(session.user.id, session.user.email);
    const booking = await bookingService.getById(trip.bookingId);
    if (
      booking?.renterId !== userId &&
      booking?.hostId !== userId &&
      session.user.role !== "admin"
    ) {
      return errorResponse(new ApiError(403, "FORBIDDEN", "Forbidden"));
    }

    const locations = await tripService.getLocations(id);
    return NextResponse.json({ trip, locations });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse(new ApiError(401, "UNAUTHORIZED", "Unauthorized"));
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const input = endTripSchema.parse(body);
    const userId = await resolveUserId(session.user.id, session.user.email);
    const trip = await tripService.complete(id, input, userId);
    return NextResponse.json(trip);
  } catch (error) {
    return errorResponse(error);
  }
}
