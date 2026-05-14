import { eventBus } from "@vroom/events";
import { notificationService } from "@/services/notification";
import { bookingService } from "@/services/booking";
import { paymentService } from "@/services/payment";
import { vehicleService } from "@/services/vehicle";
import { trustScoreService } from "@/services/trust-score";
import { sendEmail } from "@/lib/ses";
import {
  bookingConfirmedEmail,
  bookingCancelledEmail,
  paymentCapturedEmail,
  refundProcessedEmail,
  tripStartedEmail,
  tripCompletedEmail,
} from "@/lib/email-templates";
import { formatPrice } from "@/lib/format";
import { db } from "@/lib/db";
import { bookings, users, reviews, payments } from "@vroom/db/schema";
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

        // Send via ses (legacy path)
        await sendEmail({
          to: renter.email,
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text,
        });

        // Send email notification via notification service (new Resend path)
        await notificationService.send({
          userId: data.renterId,
          type: "booking_confirmed",
          title: "Booking confirmed",
          body: `Your booking has been confirmed. Your pickup OTP is ${otp}.`,
          data: { bookingId: data.bookingId, vehicleId: data.vehicleId, pickupOtp: otp },
          channel: "email",
          emailPayload: emailData,
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

    // In-app notification to renter
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

    // In-app notification to host
    await notificationService.send({
      userId: data.hostId,
      type: "booking_cancelled",
      title: "Booking cancelled",
      body: `A booking for your vehicle was cancelled. Reason: ${data.reason}`,
      data: { bookingId: data.bookingId, reason: data.reason },
    });

    // Email notifications for cancellation
    try {
      const [cancelledBooking, cancelledVehicle] = await Promise.all([
        bookingService.getById(data.bookingId),
        vehicleService.getById(data.vehicleId),
      ]);

      if (cancelledBooking && cancelledVehicle) {
        const vehicleName = `${cancelledVehicle.make} ${cancelledVehicle.model}`;
        const refundFormatted = data.refundAmount > 0
          ? formatPrice(data.refundAmount, cancelledBooking.currency)
          : undefined;

        // Email to renter
        const renterInfo = await getUserEmail(data.renterId);
        if (renterInfo) {
          const renterEmailData = bookingCancelledEmail({
            renterName: renterInfo.name || "there",
            vehicleName,
            bookingId: cancelledBooking.id,
            reason: data.reason,
            refundAmount: refundFormatted,
          });

          await notificationService.send({
            userId: data.renterId,
            type: "booking_cancelled",
            title: "Booking cancelled",
            body: `Your booking for ${vehicleName} has been cancelled.`,
            data: { bookingId: data.bookingId, reason: data.reason, refundAmount: data.refundAmount },
            channel: "email",
            emailPayload: renterEmailData,
          });
        }

        // Email to host
        const hostInfo = await getUserEmail(data.hostId);
        if (hostInfo) {
          const hostEmailData = bookingCancelledEmail({
            renterName: hostInfo.name || "there",
            vehicleName,
            bookingId: cancelledBooking.id,
            reason: data.reason,
          });

          await notificationService.send({
            userId: data.hostId,
            type: "booking_cancelled",
            title: "Booking cancelled",
            body: `A booking for your ${vehicleName} was cancelled.`,
            data: { bookingId: data.bookingId, reason: data.reason },
            channel: "email",
            emailPayload: hostEmailData,
          });
        }
      }
    } catch (err) {
      logger.error("Failed to send booking cancelled email", { error: err instanceof Error ? err.message : String(err) });
    }

    // Trust score: penalize the user who cancelled
    try {
      const booking = await bookingService.getById(data.bookingId);
      if (booking?.cancelledBy) {
        const hoursUntilStart =
          (new Date(booking.startDate).getTime() -
            (booking.cancelledAt
              ? new Date(booking.cancelledAt).getTime()
              : Date.now())) /
          (1000 * 60 * 60);
        const isLateCancellation = hoursUntilStart < 24;
        const delta = isLateCancellation ? -0.1 : -0.05;
        const reason = isLateCancellation
          ? "Late cancellation (< 24h before start)"
          : "Booking cancellation";

        await trustScoreService.applyScoreDelta(booking.cancelledBy, delta, reason);
        await trustScoreService.checkAutoModeration(booking.cancelledBy);
      }
    } catch (err) {
      logger.error("Trust score update failed on booking.cancelled", {
        bookingId: data.bookingId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  eventBus.subscribe("payment.captured", async (data) => {
    logger.info("Payment captured", { paymentId: data.paymentId, bookingId: data.bookingId });

    try {
      const booking = await bookingService.getById(data.bookingId);
      if (!booking) return;

      const [vehicle, renter] = await Promise.all([
        vehicleService.getById(booking.vehicleId),
        getUserEmail(booking.renterId),
      ]);

      const vehicleName = vehicle ? `${vehicle.make} ${vehicle.model}` : "your vehicle";
      const amountFormatted = formatPrice(data.amount, booking.currency);

      // In-app notification
      await notificationService.send({
        userId: booking.renterId,
        type: "payment_captured",
        title: "Payment received",
        body: `Payment of ${amountFormatted} received for ${vehicleName}.`,
        data: { paymentId: data.paymentId, bookingId: data.bookingId, amount: data.amount },
      });

      // Email notification
      if (renter) {
        const emailData = paymentCapturedEmail({
          renterName: renter.name || "there",
          vehicleName,
          amount: amountFormatted,
          bookingId: booking.id,
        });

        await notificationService.send({
          userId: booking.renterId,
          type: "payment_captured",
          title: "Payment received",
          body: `Payment of ${amountFormatted} received for ${vehicleName}.`,
          data: { paymentId: data.paymentId, bookingId: data.bookingId, amount: data.amount },
          channel: "email",
          emailPayload: emailData,
        });
      }
    } catch (err) {
      logger.error("Failed on payment.captured", { error: err instanceof Error ? err.message : String(err) });
    }
  });

  eventBus.subscribe("payment.refunded", async (data) => {
    logger.info("Payment refunded", { paymentId: data.paymentId, bookingId: data.bookingId });

    try {
      const booking = await bookingService.getById(data.bookingId);
      if (!booking) return;

      const [vehicle, renter] = await Promise.all([
        vehicleService.getById(booking.vehicleId),
        getUserEmail(booking.renterId),
      ]);

      const vehicleName = vehicle ? `${vehicle.make} ${vehicle.model}` : "your vehicle";
      const amountFormatted = formatPrice(data.amount, booking.currency);

      // In-app notification
      await notificationService.send({
        userId: booking.renterId,
        type: "payment_refunded",
        title: "Refund processed",
        body: `A refund of ${amountFormatted} has been processed for ${vehicleName}.`,
        data: { paymentId: data.paymentId, bookingId: data.bookingId, amount: data.amount },
      });

      // Email notification
      if (renter) {
        const emailData = refundProcessedEmail({
          renterName: renter.name || "there",
          vehicleName,
          amount: amountFormatted,
          bookingId: booking.id,
        });

        await notificationService.send({
          userId: booking.renterId,
          type: "payment_refunded",
          title: "Refund processed",
          body: `A refund of ${amountFormatted} has been processed for ${vehicleName}.`,
          data: { paymentId: data.paymentId, bookingId: data.bookingId, amount: data.amount },
          channel: "email",
          emailPayload: emailData,
        });
      }
    } catch (err) {
      logger.error("Failed on payment.refunded", { error: err instanceof Error ? err.message : String(err) });
    }
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

  eventBus.subscribe("booking.completed", async (data) => {
    // Trust score: reward both renter and host for completing a booking
    try {
      await trustScoreService.applyScoreDelta(
        data.renterId,
        0.02,
        "Booking completed (renter)"
      );
      await trustScoreService.checkAutoModeration(data.renterId);

      await trustScoreService.applyScoreDelta(
        data.hostId,
        0.02,
        "Booking completed (host)"
      );
      await trustScoreService.checkAutoModeration(data.hostId);
    } catch (err) {
      logger.error("Trust score update failed on booking.completed", {
        bookingId: data.bookingId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  eventBus.subscribe("review.created", async (data) => {
    console.log(`[event] Review created: ${data.reviewId} rating=${data.rating}`);

    // Trust score: apply rating-based delta to the reviewee
    try {
      const [review] = (await db
        .select({ revieweeId: reviews.revieweeId })
        .from(reviews)
        .where(eq(reviews.id, data.reviewId))
        .limit(1)) as { revieweeId: string | null }[];

      if (review?.revieweeId) {
        const ratingDeltas: Record<number, number> = {
          5: 0.03,
          4: 0.01,
          3: 0,
          2: -0.02,
          1: -0.05,
        };
        const delta = ratingDeltas[data.rating] ?? 0;
        if (delta !== 0) {
          await trustScoreService.applyScoreDelta(
            review.revieweeId,
            delta,
            `Review received (${data.rating}-star)`
          );
          await trustScoreService.checkAutoModeration(review.revieweeId);
        }
      }
    } catch (err) {
      logger.error("Trust score update failed on review.created", {
        reviewId: data.reviewId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  eventBus.subscribe("payment.failed", async (data) => {
    logger.warn("Payment failed", {
      paymentId: data.paymentId,
      bookingId: data.bookingId,
      error: data.error,
    });

    // Trust score: penalize the user whose payment failed
    try {
      const [payment] = (await db
        .select({ userId: payments.userId })
        .from(payments)
        .where(eq(payments.id, data.paymentId))
        .limit(1)) as { userId: string }[];

      if (payment?.userId) {
        await trustScoreService.applyScoreDelta(
          payment.userId,
          -0.05,
          "Payment failure"
        );
        await trustScoreService.checkAutoModeration(payment.userId);
      }
    } catch (err) {
      logger.error("Trust score update failed on payment.failed", {
        paymentId: data.paymentId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });
}
