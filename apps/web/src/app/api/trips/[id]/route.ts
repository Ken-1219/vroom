import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { tripService } from "@/services/trip";
import { endTripSchema } from "@vroom/validators";
import { ApiError, errorResponse } from "@/lib/api-error";

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
    const trip = await tripService.complete(id, input, session.user.id);
    return NextResponse.json(trip);
  } catch (error) {
    return errorResponse(error);
  }
}
