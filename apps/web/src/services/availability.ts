import { db } from "@/lib/db";
import {
  vehicleAvailability,
  vehicles,
  bookings,
  type VehicleAvailability,
} from "@vroom/db/schema";
import { eq, and, lt, gt, lte, gte, sql, inArray } from "drizzle-orm";

export class AvailabilityService {
  async getByVehicle(
    vehicleId: string,
    startDate?: string,
    endDate?: string
  ): Promise<VehicleAvailability[]> {
    const conditions = [eq(vehicleAvailability.vehicleId, vehicleId)];

    if (startDate) {
      conditions.push(gte(vehicleAvailability.endDate, startDate));
    }
    if (endDate) {
      conditions.push(lte(vehicleAvailability.startDate, endDate));
    }

    return db
      .select()
      .from(vehicleAvailability)
      .where(and(...conditions))
      .orderBy(vehicleAvailability.startDate) as Promise<VehicleAvailability[]>;
  }

  async setBlocked(
    vehicleId: string,
    hostId: string,
    startDate: string,
    endDate: string,
    type: "blocked" | "maintenance",
    reason?: string
  ): Promise<VehicleAvailability> {
    // Verify host owns the vehicle
    const vehicle = (
      await db
        .select({ id: vehicles.id, hostId: vehicles.hostId })
        .from(vehicles)
        .where(eq(vehicles.id, vehicleId))
        .limit(1)
    )[0];

    if (!vehicle) {
      throw new Error("Vehicle not found");
    }
    if (vehicle.hostId !== hostId) {
      throw new Error("Not authorized");
    }

    const result = (await db
      .insert(vehicleAvailability)
      .values({
        vehicleId,
        startDate,
        endDate,
        type,
        reason: reason ?? null,
      })
      .returning()) as VehicleAvailability[];

    return result[0]!;
  }

  async removeBlocked(id: string, hostId: string): Promise<void> {
    // Look up the availability record and verify ownership via vehicle
    const record = (
      await db
        .select({
          id: vehicleAvailability.id,
          vehicleId: vehicleAvailability.vehicleId,
        })
        .from(vehicleAvailability)
        .where(eq(vehicleAvailability.id, id))
        .limit(1)
    )[0];

    if (!record) {
      throw new Error("Availability record not found");
    }

    const vehicle = (
      await db
        .select({ hostId: vehicles.hostId })
        .from(vehicles)
        .where(eq(vehicles.id, record.vehicleId))
        .limit(1)
    )[0];

    if (!vehicle || vehicle.hostId !== hostId) {
      throw new Error("Not authorized");
    }

    await db
      .delete(vehicleAvailability)
      .where(eq(vehicleAvailability.id, id));
  }

  async isAvailable(
    vehicleId: string,
    startDate: Date,
    endDate: Date
  ): Promise<boolean> {
    const startStr = startDate.toISOString().split("T")[0]!;
    const endStr = endDate.toISOString().split("T")[0]!;

    // Check for overlapping blocked/maintenance periods
    const blockedOverlaps = (await db
      .select({ id: vehicleAvailability.id })
      .from(vehicleAvailability)
      .where(
        and(
          eq(vehicleAvailability.vehicleId, vehicleId),
          lt(vehicleAvailability.startDate, endStr),
          gt(vehicleAvailability.endDate, startStr)
        )
      )
      .limit(1)) as { id: string }[];

    if (blockedOverlaps.length > 0) {
      return false;
    }

    // Check for overlapping confirmed/active bookings
    const bookingOverlaps = (await db
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

    return bookingOverlaps.length === 0;
  }
}

export const availabilityService = new AvailabilityService();
