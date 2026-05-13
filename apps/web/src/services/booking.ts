import { db } from "@/lib/db";
import { bookings, bookingEvents, outboxEvents, type Booking } from "@vroom/db/schema";
import { eq, and, desc, sql, lt, gte, inArray } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { pricingService } from "@/services/pricing";
import type { CreateBookingInput } from "@vroom/validators";

export class BookingService {
  async hasOverlappingBooking(
    vehicleId: string,
    startDate: Date,
    endDate: Date
  ): Promise<boolean> {
    const overlaps = (await db
      .select({ id: bookings.id })
      .from(bookings)
      .where(
        and(
          eq(bookings.vehicleId, vehicleId),
          inArray(bookings.status, ["pending", "confirmed", "active"]),
          lt(bookings.startDate, endDate),
          gte(bookings.endDate, startDate)
        )
      )
      .limit(1)) as { id: string }[];
    return overlaps.length > 0;
  }

  async create(
    input: CreateBookingInput & { totalAmount: number; priceBreakdown: Record<string, unknown>; currency?: string },
    renterId: string,
    hostId: string
  ) {
    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);

    // Auto-cancel any stale unpaid pending bookings from this renter for this vehicle
    await db
      .update(bookings)
      .set({
        status: "cancelled",
        cancelledBy: renterId,
        cancellationReason: "Replaced by new booking attempt",
        cancelledAt: new Date(),
      })
      .where(
        and(
          eq(bookings.vehicleId, input.vehicleId),
          eq(bookings.renterId, renterId),
          eq(bookings.status, "pending")
        )
      );

    // Atomic insert-if-no-overlap using raw SQL to prevent double-booking race condition.
    // A Drizzle check-then-insert is NOT atomic with the Neon HTTP driver (no transactions).
    const rawSql = neon(process.env.DATABASE_URL!);
    const rows = await rawSql`
      INSERT INTO bookings (
        renter_id, vehicle_id, host_id, status,
        start_date, end_date,
        pickup_latitude, pickup_longitude, pickup_address,
        dropoff_latitude, dropoff_longitude, dropoff_address,
        total_amount, currency, price_breakdown, coupon_code
      )
      SELECT
        ${renterId}, ${input.vehicleId}, ${hostId}, 'pending',
        ${startDate.toISOString()}::timestamptz, ${endDate.toISOString()}::timestamptz,
        ${input.pickupLatitude?.toString() ?? null}, ${input.pickupLongitude?.toString() ?? null}, ${input.pickupAddress ?? null},
        ${input.dropoffLatitude?.toString() ?? null}, ${input.dropoffLongitude?.toString() ?? null}, ${input.dropoffAddress ?? null},
        ${input.totalAmount}, ${input.currency ?? "INR"}, ${JSON.stringify(input.priceBreakdown)}::jsonb, ${input.couponCode ?? null}
      WHERE NOT EXISTS (
        SELECT 1 FROM bookings
        WHERE vehicle_id = ${input.vehicleId}
          AND status IN ('pending', 'confirmed', 'active')
          AND start_date < ${endDate.toISOString()}::timestamptz
          AND end_date > ${startDate.toISOString()}::timestamptz
      )
      AND NOT EXISTS (
        SELECT 1 FROM vehicle_availability
        WHERE vehicle_id = ${input.vehicleId}
          AND start_date < ${endDate.toISOString().split("T")[0]}
          AND end_date > ${startDate.toISOString().split("T")[0]}
      )
      RETURNING *
    `;

    if (rows.length === 0) {
      throw new Error("This vehicle is unavailable for the selected dates");
    }

    const booking = rows as unknown as Booking[];

    const created = booking[0]!;

    await db.insert(bookingEvents).values({
      bookingId: created.id,
      eventType: "created",
      data: { input },
      actorId: renterId,
      actorType: "user",
    });

    await db.insert(outboxEvents).values({
      eventType: "booking.created",
      payload: {
        bookingId: created.id,
        vehicleId: input.vehicleId,
        renterId,
        hostId,
      },
    });

    return created;
  }

  async getById(id: string): Promise<Booking | null> {
    const result = (await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, id))
      .limit(1)) as Booking[];
    return result[0] ?? null;
  }

  async getByRenter(renterId: string): Promise<Booking[]> {
    return db
      .select()
      .from(bookings)
      .where(eq(bookings.renterId, renterId))
      .orderBy(desc(bookings.createdAt)) as Promise<Booking[]>;
  }

  async getByHost(hostId: string): Promise<Booking[]> {
    return db
      .select()
      .from(bookings)
      .where(eq(bookings.hostId, hostId))
      .orderBy(desc(bookings.createdAt)) as Promise<Booking[]>;
  }

  async cancel(bookingId: string, cancelledBy: string, reason: string) {
    const booking = await this.getById(bookingId);
    if (!booking) throw new Error("Booking not found");
    if (!["pending", "confirmed"].includes(booking.status)) {
      throw new Error("Booking cannot be cancelled");
    }

    const updated = (await db
      .update(bookings)
      .set({
        status: "cancelled",
        cancelledBy,
        cancellationReason: reason,
        cancelledAt: new Date(),
        version: sql`${bookings.version} + 1`,
      })
      .where(
        and(eq(bookings.id, bookingId), eq(bookings.version, booking.version ?? 1))
      )
      .returning()) as Booking[];

    if (updated.length === 0) {
      throw new Error("Concurrent modification — try again");
    }

    await db.insert(bookingEvents).values({
      bookingId,
      eventType: "cancelled",
      data: { reason, cancelledBy },
      actorId: cancelledBy,
      actorType: "user",
    });

    const hoursUntilStart =
      (new Date(booking.startDate).getTime() - Date.now()) / (1000 * 60 * 60);
    const { refundAmount } = pricingService.getCancellationRefund(
      booking.totalAmount,
      hoursUntilStart
    );

    await db.insert(outboxEvents).values({
      eventType: "booking.cancelled",
      payload: {
        bookingId,
        vehicleId: booking.vehicleId,
        renterId: booking.renterId,
        hostId: booking.hostId,
        reason,
        refundAmount,
      },
    });

    return updated[0]!;
  }

  async accept(bookingId: string, hostId: string) {
    const booking = await this.getById(bookingId);
    if (!booking) throw new Error("Booking not found");
    if (booking.status !== "pending") {
      throw new Error("Only pending bookings can be accepted");
    }

    const updated = (await db
      .update(bookings)
      .set({
        status: "confirmed",
        version: sql`${bookings.version} + 1`,
      })
      .where(
        and(
          eq(bookings.id, bookingId),
          eq(bookings.version, booking.version ?? 1)
        )
      )
      .returning()) as Booking[];

    if (updated.length === 0) {
      throw new Error("Concurrent modification — try again");
    }

    await db.insert(bookingEvents).values({
      bookingId,
      eventType: "confirmed",
      data: { acceptedBy: hostId },
      actorId: hostId,
      actorType: "user",
    });

    await db.insert(outboxEvents).values({
      eventType: "booking.confirmed",
      payload: {
        bookingId,
        vehicleId: booking.vehicleId,
        renterId: booking.renterId,
        hostId: booking.hostId,
      },
    });

    return updated[0]!;
  }

  async reject(bookingId: string, hostId: string, reason: string) {
    const booking = await this.getById(bookingId);
    if (!booking) throw new Error("Booking not found");
    if (booking.status !== "pending") {
      throw new Error("Only pending bookings can be rejected");
    }

    const updated = (await db
      .update(bookings)
      .set({
        status: "cancelled",
        cancelledBy: hostId,
        cancellationReason: reason,
        cancelledAt: new Date(),
        version: sql`${bookings.version} + 1`,
      })
      .where(
        and(
          eq(bookings.id, bookingId),
          eq(bookings.version, booking.version ?? 1)
        )
      )
      .returning()) as Booking[];

    if (updated.length === 0) {
      throw new Error("Concurrent modification — try again");
    }

    await db.insert(bookingEvents).values({
      bookingId,
      eventType: "rejected",
      data: { reason, rejectedBy: hostId },
      actorId: hostId,
      actorType: "user",
    });

    await db.insert(outboxEvents).values({
      eventType: "booking.cancelled",
      payload: {
        bookingId,
        vehicleId: booking.vehicleId,
        renterId: booking.renterId,
        hostId: booking.hostId,
        reason,
        refundAmount: booking.totalAmount,
      },
    });

    return updated[0]!;
  }
}

export const bookingService = new BookingService();
