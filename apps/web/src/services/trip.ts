import { db } from "@/lib/db";
import { trips, tripLocations, bookings, outboxEvents, type Trip, type TripLocation } from "@vroom/db/schema";
import { eq, and, sql } from "drizzle-orm";
import type { StartTripInput, EndTripInput, TripLocationInput } from "@vroom/validators";

export class TripService {
  async start(input: StartTripInput, hostId: string): Promise<Trip> {
    const booking = (await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, input.bookingId))
      .limit(1)) as (typeof bookings.$inferSelect)[];

    const b = booking[0];
    if (!b) throw new Error("Booking not found");
    if (b.hostId !== hostId) throw new Error("Not authorized");
    if (b.status !== "confirmed") throw new Error("Booking must be confirmed to start trip");

    const existing = (await db
      .select({ id: trips.id })
      .from(trips)
      .where(eq(trips.bookingId, input.bookingId))
      .limit(1)) as { id: string }[];
    if (existing.length > 0) throw new Error("Trip already started for this booking");

    const trip = (await db
      .insert(trips)
      .values({
        bookingId: input.bookingId,
        status: "active",
        actualStart: new Date(),
        startOdometer: input.odometer,
        startFuelLevel: input.fuelLevel.toString(),
        preInspection: input.preInspection,
      })
      .returning()) as Trip[];

    await db
      .update(bookings)
      .set({
        status: "active",
        version: sql`${bookings.version} + 1`,
      })
      .where(eq(bookings.id, input.bookingId));

    const created = trip[0]!;

    await db.insert(outboxEvents).values({
      eventType: "trip.started",
      payload: {
        tripId: created.id,
        bookingId: input.bookingId,
      },
    });

    return created;
  }

  async complete(tripId: string, input: EndTripInput, hostId: string): Promise<Trip> {
    const trip = await this.getById(tripId);
    if (!trip) throw new Error("Trip not found");
    if (trip.status !== "active") throw new Error("Trip is not active");

    const booking = (await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, trip.bookingId))
      .limit(1)) as (typeof bookings.$inferSelect)[];

    if (!booking[0] || booking[0].hostId !== hostId) throw new Error("Not authorized");

    const updated = (await db
      .update(trips)
      .set({
        status: "completed",
        actualEnd: new Date(),
        endOdometer: input.odometer,
        endFuelLevel: input.fuelLevel.toString(),
        postInspection: input.postInspection,
      })
      .where(eq(trips.id, tripId))
      .returning()) as Trip[];

    await db
      .update(bookings)
      .set({
        status: "completed",
        version: sql`${bookings.version} + 1`,
      })
      .where(eq(bookings.id, trip.bookingId));

    await db.insert(outboxEvents).values({
      eventType: "trip.completed",
      payload: {
        tripId,
        bookingId: trip.bookingId,
      },
    });

    return updated[0]!;
  }

  async getById(id: string): Promise<Trip | null> {
    const result = (await db
      .select()
      .from(trips)
      .where(eq(trips.id, id))
      .limit(1)) as Trip[];
    return result[0] ?? null;
  }

  async getByBooking(bookingId: string): Promise<Trip | null> {
    const result = (await db
      .select()
      .from(trips)
      .where(eq(trips.bookingId, bookingId))
      .limit(1)) as Trip[];
    return result[0] ?? null;
  }

  async addLocation(tripId: string, input: TripLocationInput): Promise<TripLocation> {
    const locations = (await db
      .insert(tripLocations)
      .values({
        tripId,
        latitude: input.latitude.toString(),
        longitude: input.longitude.toString(),
        speed: input.speed?.toString() ?? null,
        heading: input.heading?.toString() ?? null,
        recordedAt: new Date(input.recordedAt),
      })
      .returning()) as TripLocation[];
    return locations[0]!;
  }

  async getLocations(tripId: string): Promise<TripLocation[]> {
    return db
      .select()
      .from(tripLocations)
      .where(eq(tripLocations.tripId, tripId))
      .orderBy(tripLocations.recordedAt) as Promise<TripLocation[]>;
  }
}

export const tripService = new TripService();
