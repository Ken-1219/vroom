import { NextRequest, NextResponse } from "next/server";
import { createBookingSchema } from "@vroom/validators";
import { bookingService } from "@/services/booking";
import { vehicleService } from "@/services/vehicle";
import { pricingService } from "@/services/pricing";
import { auth } from "@/lib/auth";
import { bearerAuth } from "@/lib/bearer-auth";
import { db } from "@/lib/db";
import { users } from "@vroom/db/schema";
import { eq } from "drizzle-orm";
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
    const existingUser = await (db as any)
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, currentUser.id))
      .limit(1);

    if (existingUser.length === 0) {
      await (db as any).insert(users).values({
        id: currentUser.id,
        email: currentUser.email,
        name: currentUser.name ?? currentUser.email,
        role: currentUser.role ?? "renter",
        avatarUrl: (currentUser as any).image ?? null,
        emailVerified: true,
      });
    }

    const body = await request.json();
    const parsed = createBookingSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error);
    }

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
      currentUser.id,
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
