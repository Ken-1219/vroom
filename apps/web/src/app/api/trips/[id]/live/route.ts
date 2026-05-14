import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { trips, tripLocations, bookings } from "@vroom/db/schema";
import { eq, and, gt, desc } from "drizzle-orm";
import { resolveUserId } from "@/lib/resolve-user-id";
import type { Trip, TripLocation } from "@vroom/db/schema";

export const dynamic = "force-dynamic";

const POLL_INTERVAL_MS = 3_000;
const HEARTBEAT_INTERVAL_MS = 15_000;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json(
      { error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
      { status: 401 }
    );
  }

  const { id: tripId } = await params;

  // Fetch trip
  const tripRows = (await db
    .select()
    .from(trips)
    .where(eq(trips.id, tripId))
    .limit(1)) as Trip[];

  const trip = tripRows[0];
  if (!trip) {
    return Response.json(
      { error: { code: "NOT_FOUND", message: "Trip not found" } },
      { status: 404 }
    );
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
    return Response.json(
      { error: { code: "FORBIDDEN", message: "Forbidden" } },
      { status: 403 }
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let lastSeenAt: Date = new Date(0);
      let lastHeartbeat = Date.now();
      let closed = false;

      function enqueue(text: string) {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(text));
        } catch {
          // Stream already closed by client
          closed = true;
        }
      }

      // Send initial trip-info event
      enqueue(
        `event: trip-info\ndata: ${JSON.stringify({
          id: trip.id,
          bookingId: trip.bookingId,
          status: trip.status,
          actualStart: trip.actualStart,
          actualEnd: trip.actualEnd,
          startOdometer: trip.startOdometer,
          endOdometer: trip.endOdometer,
          startFuelLevel: trip.startFuelLevel,
          endFuelLevel: trip.endFuelLevel,
        })}\n\n`
      );

      // If the trip is already completed, send completed event and close
      if (trip.status === "completed") {
        enqueue(
          `event: trip-completed\ndata: ${JSON.stringify({
            id: trip.id,
            status: "completed",
            actualStart: trip.actualStart,
            actualEnd: trip.actualEnd,
            startOdometer: trip.startOdometer,
            endOdometer: trip.endOdometer,
          })}\n\n`
        );
        controller.close();
        return;
      }

      // Poll loop
      async function poll() {
        if (closed) return;

        try {
          // Check trip status
          const currentTripRows = (await db
            .select()
            .from(trips)
            .where(eq(trips.id, tripId))
            .limit(1)) as Trip[];

          const currentTrip = currentTripRows[0];
          if (!currentTrip) {
            closed = true;
            controller.close();
            return;
          }

          // Fetch new locations since lastSeenAt
          const newLocations = (await db
            .select()
            .from(tripLocations)
            .where(
              and(
                eq(tripLocations.tripId, tripId),
                gt(tripLocations.recordedAt, lastSeenAt)
              )
            )
            .orderBy(tripLocations.recordedAt)) as TripLocation[];

          for (const loc of newLocations) {
            enqueue(
              `data: ${JSON.stringify({
                latitude: loc.latitude,
                longitude: loc.longitude,
                speed: loc.speed,
                heading: loc.heading,
                recordedAt: loc.recordedAt,
              })}\n\n`
            );
            if (loc.recordedAt && loc.recordedAt > lastSeenAt) {
              lastSeenAt = loc.recordedAt;
            }
          }

          // Send heartbeat if needed
          const now = Date.now();
          if (now - lastHeartbeat >= HEARTBEAT_INTERVAL_MS) {
            enqueue(`: heartbeat\n\n`);
            lastHeartbeat = now;
          }

          // If trip is completed, send final event and close
          if (currentTrip.status === "completed") {
            enqueue(
              `event: trip-completed\ndata: ${JSON.stringify({
                id: currentTrip.id,
                status: "completed",
                actualStart: currentTrip.actualStart,
                actualEnd: currentTrip.actualEnd,
                startOdometer: currentTrip.startOdometer,
                endOdometer: currentTrip.endOdometer,
              })}\n\n`
            );
            closed = true;
            controller.close();
            return;
          }

          // Schedule next poll
          setTimeout(poll, POLL_INTERVAL_MS);
        } catch {
          // On error, close the stream gracefully
          if (!closed) {
            closed = true;
            try {
              controller.close();
            } catch {
              // already closed
            }
          }
        }
      }

      // Start polling after initial event
      setTimeout(poll, POLL_INTERVAL_MS);
    },

    cancel() {
      // Client disconnected — nothing to clean up since setTimeout
      // will find `closed = true` and stop
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
