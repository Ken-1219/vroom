import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { bookingService } from "@/services/booking";
import { paymentService } from "@/services/payment";
import { verifyPaymentSchema } from "@vroom/validators";
import { ApiError, errorResponse } from "@/lib/api-error";
import { db } from "@/lib/db";
import { bookings, bookingEvents } from "@vroom/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { eventBus } from "@vroom/events";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse(new ApiError(401, "UNAUTHORIZED", "Unauthorized"));
  }

  try {
    const body = await request.json();
    const parsed = verifyPaymentSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error);
    }

    const { bookingId, razorpay_payment_id, razorpay_order_id, razorpay_signature } =
      parsed.data;

    const booking = await bookingService.getById(bookingId);
    if (!booking) {
      return errorResponse(
        new ApiError(404, "NOT_FOUND", "Booking not found")
      );
    }

    if (booking.renterId !== session.user.id) {
      return errorResponse(new ApiError(403, "FORBIDDEN", "Forbidden"));
    }

    // Capture payment (verifies signature internally)
    await paymentService.capturePayment(
      bookingId,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature
    );

    // Update booking to confirmed
    const updated = await (db as any)
      .update(bookings)
      .set({
        status: "confirmed",
        version: sql`${bookings.version} + 1`,
      })
      .where(
        and(
          eq(bookings.id, bookingId),
          eq(bookings.status, "pending")
        )
      )
      .returning();

    if (updated.length > 0) {
      await (db as any).insert(bookingEvents).values({
        bookingId,
        eventType: "payment_captured",
        data: {
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
        },
        actorId: session.user.id,
        actorType: "user",
      });

      eventBus.publish("booking.confirmed", {
        bookingId,
        vehicleId: booking.vehicleId,
        renterId: booking.renterId,
        hostId: booking.hostId,
      });
    }

    return NextResponse.json({
      success: true,
      bookingId,
      status: "confirmed",
    });
  } catch (error) {
    return errorResponse(error);
  }
}
