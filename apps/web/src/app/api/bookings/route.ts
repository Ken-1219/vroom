import { NextRequest, NextResponse } from "next/server";
import { createBookingSchema } from "@vroom/validators";
import { bookingService } from "@/services/booking";
import { vehicleService } from "@/services/vehicle";
import { pricingService } from "@/services/pricing";
import { auth } from "@/lib/auth";
import { bearerAuth } from "@/lib/bearer-auth";
import { db } from "@/lib/db";
import { users, bookings } from "@vroom/db/schema";
import { eq, and, lt } from "drizzle-orm";
import { ApiError, errorResponse } from "@/lib/api-error";
import { registerEventHandlers } from "@/lib/event-handlers";

registerEventHandlers();

export async function POST(request: NextRequest) {
  const session = await auth();
  const bearer = session?.user ? null : await bearerAuth(request);
  const currentUser = session?.user ?? bearer;

  if (!currentUser?.id) {
    return errorResponse(new ApiError(401, "UNAUTHORIZED", "Unauthorized"));
  }

  try {
    // Resolve the effective user ID that actually exists in the DB.
    // If the same Google account logs in across sessions it may get different
    // session IDs — we always look up by email first so the FK on bookings works.
    let effectiveUserId = currentUser.id;
    const byEmail = await (db as any)
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, currentUser.email!))
      .limit(1) as { id: string }[];

    if (byEmail.length > 0) {
      // User already exists — use the stable ID from the DB
      effectiveUserId = byEmail[0]!.id;
    } else {
      // Truly new user — insert them
      await (db as any).insert(users).values({
        id: currentUser.id,
        email: currentUser.email,
        name: currentUser.name ?? currentUser.email,
        role: currentUser.role ?? "renter",
        avatarUrl: (currentUser as any).image ?? null,
        emailVerified: true,
      }).onConflictDoNothing();
      // Re-read in case of a race (two requests hitting this path simultaneously)
      const inserted = await (db as any)
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, currentUser.email!))
        .limit(1) as { id: string }[];
      if (inserted.length > 0) effectiveUserId = inserted[0]!.id;
    }

    const body = await request.json();
    const parsed = createBookingSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error);
    }

    // Auto-expire stale pending bookings (>15 min, never paid) for this vehicle
    // so they don't permanently block availability when a user abandoned checkout.
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    await (db as any)
      .update(bookings)
      .set({
        status: "cancelled",
        cancelledBy: "system",
        cancellationReason: "Booking expired — payment not completed",
        cancelledAt: new Date(),
      })
      .where(
        and(
          eq(bookings.vehicleId, parsed.data.vehicleId),
          eq(bookings.status, "pending"),
          lt(bookings.createdAt, fifteenMinutesAgo)
        )
      );

    const vehicle = await vehicleService.getById(parsed.data.vehicleId);
    if (!vehicle) {
      return errorResponse(new ApiError(404, "NOT_FOUND", "Vehicle not found"));
    }

    const protectionPlan = (body.protectionPlan as "basic" | "standard" | "premium") ?? "basic";

    const breakdown = pricingService.calculateEstimate({
      vehicle,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
      protectionPlan,
    });

    if (breakdown.days < 1) {
      return errorResponse(
        new ApiError(400, "VALIDATION_ERROR", "End date must be after start date")
      );
    }

    const booking = await bookingService.create(
      {
        ...parsed.data,
        totalAmount: breakdown.total,
        priceBreakdown: breakdown as unknown as Record<string, unknown>,
        currency: vehicle.currency,
      },
      effectiveUserId,
      vehicle.hostId
    );

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function GET(request: NextRequest) {
  const session = await auth();
  const bearer = session?.user ? null : await bearerAuth(request);
  const currentUser = session?.user ?? bearer;

  if (!currentUser?.id) {
    return errorResponse(new ApiError(401, "UNAUTHORIZED", "Unauthorized"));
  }

  try {
    const bookings = await bookingService.getByRenter(currentUser.id);
    return NextResponse.json(bookings);
  } catch (error) {
    return errorResponse(error);
  }
}
