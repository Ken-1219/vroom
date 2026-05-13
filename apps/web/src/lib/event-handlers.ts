import { eventBus } from "@vroom/events";
import { notificationService } from "@/services/notification";
import { bookingService } from "@/services/booking";
import { paymentService } from "@/services/payment";
import { vehicleService } from "@/services/vehicle";
import { sendEmail } from "@/lib/ses";
import { bookingConfirmedEmail, tripStartedEmail, tripCompletedEmail } from "@/lib/email-templates";
import { formatPrice } from "@/lib/format";
import { db } from "@/lib/db";
import { bookings, users } from "@vroom/db/schema";
import { eq, sql } from "drizzle-orm";
import crypto from "crypto";
import { logger } from "@/lib/logger";

function generateOtp(): string {
  return String(crypto.randomInt(100000, 1000000));
}

async function getUserEmail(userId: string): Promise<{ email: string; name: string } | null> {
  const result = (await db
    .select({ email: users.email, name: users.name })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)) as { email: string; name: string }[];
  return result[0] ?? null;
}

let registered = false;

export function registerEventHandlers() {
  if (registered) return;
  registered = true;

  eventBus.subscribe("booking.created", async (data) => {
    await notificationService.send({
      userId: data.hostId,
      type: "booking_created",
      title: "New booking request",
      body: "You have a new booking request. Review and respond to it.",
      data: { bookingId: data.bookingId, vehicleId: data.vehicleId },
    });
  });

  eventBus.subscribe("booking.confirmed", async (data) => {
    const otp = generateOtp();

    const otpUpdated = await db
      .update(bookings)
      .set({ pickupOtp: otp })
      .where(eq(bookings.id, data.bookingId))
      .returning() as { id: string }[];

    if (otpUpdated.length === 0) {
      logger.error("Failed to persist pickup OTP for booking", { bookingId: data.bookingId });
      return;
    }

    await notificationService.send({
      userId: data.renterId,
      type: "booking_confirmed",
      title: "Booking confirmed",
      body: `Your booking has been confirmed. Your pickup OTP is ${otp}.`,
      data: { bookingId: data.bookingId, vehicleId: data.vehicleId, pickupOtp: otp },
    });

    try {
      const [booking, vehicle, renter] = await Promise.all([
        bookingService.getById(data.bookingId),
        vehicleService.getById(data.vehicleId),
        getUserEmail(data.renterId),
      ]);

      if (booking && vehicle && renter?.email) {
        const startDate = new Date(booking.startDate).toLocaleDateString("en-IN", {
          weekday: "short", day: "numeric", month: "short", year: "numeric",
        });
        const endDate = new Date(booking.endDate).toLocaleDateString("en-IN", {
          weekday: "short", day: "numeric", month: "short", year: "numeric",
        });

        const emailData = bookingConfirmedEmail({
          renterName: renter.name || "there",
          vehicleName: `${vehicle.make} ${vehicle.model}`,
          vehicleYear: vehicle.year,
          pickupDate: startDate,
          dropoffDate: endDate,
          pickupAddress: booking.pickupAddress ?? vehicle.address ?? vehicle.city,
          totalAmount: formatPrice(booking.totalAmount, booking.currency),
          pickupOtp: otp,
          bookingId: booking.id,
          vehicleId: vehicle.id,
        });

        await sendEmail({
          to: renter.email,
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text,
        });
      }
    } catch (err) {
      logger.error("Failed to send booking confirmed email", { error: err instanceof Error ? err.message : String(err) });
    }
  });

  eventBus.subscribe("booking.cancelled", async (data) => {
    if (data.refundAmount > 0) {
      try {
        await paymentService.processRefund(
          data.bookingId,
          data.refundAmount,
          data.reason ?? "Booking cancelled"
        );
      } catch (err) {
        logger.error("Refund failed for booking", { bookingId: data.bookingId, error: err instanceof Error ? err.message : String(err) });
      }
    }

    await notificationService.send({
      userId: data.renterId,
      type: "booking_cancelled",
      title: "Booking cancelled",
      body: data.refundAmount > 0
        ? `Your booking was cancelled. A refund of ${data.refundAmount} is being processed.`
        : "Your booking was cancelled.",
      data: {
        bookingId: data.bookingId,
        reason: data.reason,
        refundAmount: data.refundAmount,
      },
    });

    await notificationService.send({
      userId: data.hostId,
      type: "booking_cancelled",
      title: "Booking cancelled",
      body: `A booking for your vehicle was cancelled. Reason: ${data.reason}`,
      data: { bookingId: data.bookingId, reason: data.reason },
    });
  });

  eventBus.subscribe("payment.captured", async (data) => {
    console.log(`[event] Payment captured: ${data.paymentId} for booking ${data.bookingId}`);
  });

  eventBus.subscribe("payment.refunded", async (data) => {
    console.log(`[event] Payment refunded: ${data.paymentId} for booking ${data.bookingId}`);
  });

  eventBus.subscribe("trip.started", async (data) => {
    try {
      const booking = await bookingService.getById(data.bookingId);
      if (!booking) return;

      const [vehicle, renter] = await Promise.all([
        vehicleService.getById(booking.vehicleId),
        getUserEmail(booking.renterId),
      ]);

      await notificationService.send({
        userId: booking.renterId,
        type: "trip_started",
        title: "Trip started",
        body: `Your trip with ${vehicle?.make ?? ""} ${vehicle?.model ?? ""} has started. Drive safe!`,
        data: { tripId: data.tripId, bookingId: data.bookingId },
      });

      if (renter?.email && vehicle) {
        const emailData = tripStartedEmail({
          renterName: renter.name || "there",
          vehicleName: `${vehicle.make} ${vehicle.model}`,
          bookingId: booking.id,
        });
        await sendEmail({ to: renter.email, ...emailData });
      }
    } catch (err) {
      logger.error("Failed on trip.started", { error: err instanceof Error ? err.message : String(err) });
    }
  });

  eventBus.subscribe("trip.completed", async (data) => {
    try {
      const booking = await bookingService.getById(data.bookingId);
      if (!booking) return;

      const [vehicle, renter] = await Promise.all([
        vehicleService.getById(booking.vehicleId),
        getUserEmail(booking.renterId),
      ]);

      await notificationService.send({
        userId: booking.renterId,
        type: "trip_completed",
        title: "Trip completed",
        body: `Your trip is complete! Leave a review to help other renters.`,
        data: { tripId: data.tripId, bookingId: data.bookingId },
      });

      if (renter?.email && vehicle) {
        const emailData = tripCompletedEmail({
          renterName: renter.name || "there",
          vehicleName: `${vehicle.make} ${vehicle.model}`,
          bookingId: booking.id,
        });
        await sendEmail({ to: renter.email, ...emailData });
      }
    } catch (err) {
      logger.error("Failed on trip.completed", { error: err instanceof Error ? err.message : String(err) });
    }
  });

  eventBus.subscribe("review.created", async (data) => {
    console.log(`[event] Review created: ${data.reviewId} rating=${data.rating}`);
  });
}
