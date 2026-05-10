import { db } from "@/lib/db";
import { bookings, bookingEvents, type Booking } from "@vroom/db/schema";
import { eq, and, desc, sql, lt, gte, inArray } from "drizzle-orm";
import { eventBus } from "@vroom/events";
import { pricingService } from "@/services/pricing";
import type { CreateBookingInput } from "@vroom/validators";

export class BookingService {
  async hasOverlappingBooking(
    vehicleId: string,
    startDate: Date,
    endDate: Date
  ): Promise<boolean> {
    const overlaps = (await (db as any)
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
    await (db as any)
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

    const conflict = await this.hasOverlappingBooking(input.vehicleId, startDate, endDate);
    if (conflict) {
      throw new Error("This vehicle is already booked for the selected dates");
    }

    const booking = (await (db as any)
      .insert(bookings)
      .values({
        renterId,
        vehicleId: input.vehicleId,
        hostId,
        status: "pending",
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        pickupLatitude: input.pickupLatitude?.toString(),
        pickupLongitude: input.pickupLongitude?.toString(),
        pickupAddress: input.pickupAddress,
        dropoffLatitude: input.dropoffLatitude?.toString(),
        dropoffLongitude: input.dropoffLongitude?.toString(),
        dropoffAddress: input.dropoffAddress,
        totalAmount: input.totalAmount,
        currency: input.currency ?? "INR",
        priceBreakdown: input.priceBreakdown,
        couponCode: input.couponCode,
      })
      .returning()) as Booking[];

    const created = booking[0]!;

    await (db as any).insert(bookingEvents).values({
      bookingId: created.id,
      eventType: "created",
      data: { input },
      actorId: renterId,
      actorType: "user",
    });

    eventBus.publish("booking.created", {
      bookingId: created.id,
      vehicleId: input.vehicleId,
      renterId,
      hostId,
    });

    return created;
  }

  async getById(id: string): Promise<Booking | null> {
    const result = (await (db as any)
      .select()
      .from(bookings)
      .where(eq(bookings.id, id))
      .limit(1)) as Booking[];
    return result[0] ?? null;
  }

  async getByRenter(renterId: string): Promise<Booking[]> {
    return (db as any)
      .select()
      .from(bookings)
      .where(eq(bookings.renterId, renterId))
      .orderBy(desc(bookings.createdAt)) as Promise<Booking[]>;
  }

  async getByHost(hostId: string): Promise<Booking[]> {
    return (db as any)
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

    const updated = (await (db as any)
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

    await (db as any).insert(bookingEvents).values({
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

    eventBus.publish("booking.cancelled", {
      bookingId,
      vehicleId: booking.vehicleId,
      renterId: booking.renterId,
      hostId: booking.hostId,
      reason,
      refundAmount,
    });

    return updated[0]!;
  }

  async accept(bookingId: string, hostId: string) {
    const booking = await this.getById(bookingId);
    if (!booking) throw new Error("Booking not found");
    if (booking.status !== "pending") {
      throw new Error("Only pending bookings can be accepted");
    }

    const updated = (await (db as any)
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

    await (db as any).insert(bookingEvents).values({
      bookingId,
      eventType: "confirmed",
      data: { acceptedBy: hostId },
      actorId: hostId,
      actorType: "user",
    });

    eventBus.publish("booking.confirmed", {
      bookingId,
      vehicleId: booking.vehicleId,
      renterId: booking.renterId,
      hostId: booking.hostId,
    });

    return updated[0]!;
  }

  async reject(bookingId: string, hostId: string, reason: string) {
    const booking = await this.getById(bookingId);
    if (!booking) throw new Error("Booking not found");
    if (booking.status !== "pending") {
      throw new Error("Only pending bookings can be rejected");
    }

    const updated = (await (db as any)
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

    await (db as any).insert(bookingEvents).values({
      bookingId,
      eventType: "rejected",
      data: { reason, rejectedBy: hostId },
      actorId: hostId,
      actorType: "user",
    });

    eventBus.publish("booking.cancelled", {
      bookingId,
      vehicleId: booking.vehicleId,
      renterId: booking.renterId,
      hostId: booking.hostId,
      reason,
      refundAmount: booking.totalAmount,
    });

    return updated[0]!;
  }
}

export const bookingService = new BookingService();
