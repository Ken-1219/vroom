import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { trips, tripLocations, bookings } from "@vroom/db/schema";
import { eq, desc } from "drizzle-orm";
import { resolveUserId } from "@/lib/resolve-user-id";
import { ApiError, errorResponse } from "@/lib/api-error";
import type { Trip, TripLocation } from "@vroom/db/schema";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse(new ApiError(401, "UNAUTHORIZED", "Unauthorized"));
  }

  try {
    const { id: tripId } = await params;

    // Fetch trip
    const tripRows = (await db
      .select()
      .from(trips)
      .where(eq(trips.id, tripId))
      .limit(1)) as Trip[];

    const trip = tripRows[0];
    if (!trip) {
      return errorResponse(new ApiError(404, "NOT_FOUND", "Trip not found"));
    }

    // Auth: only renter or host of the associated booking
    const userId = await resolveUserId(session.user.id, session.user.email);
    const bookingRows = (await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, trip.bookingId))
      .limit(1)) as (typeof bookings.$inferSelect)[];

    const booking = bookingRows[0];
    if (
      !booking ||
      (booking.renterId !== userId &&
        booking.hostId !== userId &&
        session.user.role !== "admin")
    ) {
      return errorResponse(new ApiError(403, "FORBIDDEN", "Forbidden"));
    }

    // Get the most recent location
    const locationRows = (await db
      .select()
      .from(tripLocations)
      .where(eq(tripLocations.tripId, tripId))
      .orderBy(desc(tripLocations.recordedAt))
      .limit(1)) as TripLocation[];

    const location = locationRows[0] ?? null;

    return Response.json({
      tripId,
      tripStatus: trip.status,
      location: location
        ? {
            latitude: location.latitude,
            longitude: location.longitude,
            speed: location.speed,
            heading: location.heading,
            recordedAt: location.recordedAt,
          }
        : null,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
