import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { bookingService } from "@/services/booking";
import { paymentService } from "@/services/payment";
import { createPaymentOrderSchema } from "@vroom/validators";
import { ApiError, errorResponse } from "@/lib/api-error";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse(new ApiError(401, "UNAUTHORIZED", "Unauthorized"));
  }

  try {
    const body = await request.json();
    const parsed = createPaymentOrderSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error);
    }

    const booking = await bookingService.getById(parsed.data.bookingId);
    if (!booking) {
      return errorResponse(
        new ApiError(404, "NOT_FOUND", "Booking not found")
      );
    }

    if (booking.renterId !== session.user.id) {
      return errorResponse(
        new ApiError(403, "FORBIDDEN", "Only the renter can pay for a booking")
      );
    }

    if (booking.status !== "pending") {
      return errorResponse(
        new ApiError(400, "INVALID_STATE", "Booking is not in pending state")
      );
    }

    const RAZORPAY_MAX_PAISE = 50_000_000; // ₹5,00,000 — Razorpay test limit
    if (booking.totalAmount > RAZORPAY_MAX_PAISE) {
      return errorResponse(
        new ApiError(
          400,
          "AMOUNT_TOO_LARGE",
          `Booking total ₹${Math.round(booking.totalAmount / 100).toLocaleString("en-IN")} exceeds the ₹5,00,000 limit. Please select a shorter rental period.`
        )
      );
    }

    // Check for existing captured payment
    const existingPayments = await paymentService.getByBookingId(booking.id);
    const alreadyCaptured = existingPayments.some(
      (p) => p.status === "captured" && p.type === "charge"
    );
    if (alreadyCaptured) {
      return errorResponse(
        new ApiError(409, "CONFLICT", "Payment already captured for this booking")
      );
    }

    const { orderId } = await paymentService.createOrder(
      booking.id,
      booking.totalAmount,
      booking.currency,
      session.user.id
    );

    return NextResponse.json({
      orderId,
      amount: booking.totalAmount,
      currency: booking.currency,
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
