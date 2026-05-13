import { db } from "@/lib/db";
import { payments, bookings, bookingEvents, outboxEvents, type Payment } from "@vroom/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getRazorpay, verifyPaymentSignature } from "@/lib/razorpay";

export class PaymentService {
  async createOrder(
    bookingId: string,
    amount: number,
    currency: string,
    userId: string
  ) {
    // Return existing pending order if one exists (handles frontend retries)
    const existing = await this.getByBookingId(bookingId);
    const pendingPayment = existing.find((p) => p.status === "pending" && p.type === "charge");
    if (pendingPayment?.gatewayReference) {
      return { orderId: pendingPayment.gatewayReference, paymentRecord: pendingPayment };
    }

    const razorpay = getRazorpay();

    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt: bookingId,
      notes: { bookingId, userId },
    });

    const idempotencyKey = `order_${bookingId}_${order.id}`;

    const result = (await db
      .insert(payments)
      .values({
        bookingId,
        userId,
        amount,
        currency,
        type: "charge",
        status: "pending",
        gatewayReference: order.id,
        idempotencyKey,
        metadata: { gateway: "razorpay", orderId: order.id },
      })
      .returning()) as Payment[];

    return { orderId: order.id, paymentRecord: result[0]! };
  }

  async capturePayment(
    bookingId: string,
    razorpayPaymentId: string,
    razorpayOrderId: string,
    razorpaySignature: string
  ) {
    // Idempotency: return early if this payment was already captured
    const existing = await this.getByBookingId(bookingId);
    const alreadyCaptured = existing.find(
      (p) => p.status === "captured" && p.type === "charge" &&
             (p.metadata as any)?.paymentId === razorpayPaymentId
    );
    if (alreadyCaptured) return alreadyCaptured;

    const isValid = verifyPaymentSignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    if (!isValid) {
      throw new Error("Invalid payment signature");
    }

    // Fetch payment method from Razorpay
    let method: string | null = null;
    try {
      const razorpay = getRazorpay();
      const paymentDetails = await razorpay.payments.fetch(razorpayPaymentId);
      method = paymentDetails.method ?? null;
    } catch {
      // Non-critical — proceed without method info
    }

    const updated = (await db
      .update(payments)
      .set({
        status: "captured",
        gatewayReference: razorpayPaymentId,
        method: method as "upi" | "card" | "netbanking" | "wallet" | null,
        metadata: {
          gateway: "razorpay",
          orderId: razorpayOrderId,
          paymentId: razorpayPaymentId,
        },
      })
      .where(eq(payments.gatewayReference, razorpayOrderId))
      .returning()) as Payment[];

    if (updated.length === 0) {
      throw new Error("Payment record not found for this order");
    }

    const payment = updated[0]!;

    await db.insert(outboxEvents).values({
      eventType: "payment.captured",
      payload: {
        paymentId: payment.id,
        bookingId: payment.bookingId,
        amount: payment.amount,
      },
    });

    return payment;
  }

  async processRefund(bookingId: string, amount: number, reason: string) {
    const existing = await this.getByBookingId(bookingId);
    const captured = existing.find((p) => p.status === "captured" && p.type === "charge");

    if (!captured) {
      throw new Error("No captured payment found for refund");
    }

    const razorpay = getRazorpay();
    const paymentId =
      (captured.metadata as any)?.paymentId ?? captured.gatewayReference;

    const refund = await razorpay.payments.refund(paymentId, {
      amount,
      notes: { reason, bookingId },
    });

    const idempotencyKey = `refund_${bookingId}_${captured.id}`;

    const result = (await db
      .insert(payments)
      .values({
        bookingId,
        userId: captured.userId,
        amount,
        currency: captured.currency,
        type: "refund",
        status: "refunded",
        gatewayReference: refund.id,
        idempotencyKey,
        metadata: {
          gateway: "razorpay",
          refundId: refund.id,
          originalPaymentId: paymentId,
          reason,
        },
      })
      .returning()) as Payment[];

    await db.insert(outboxEvents).values({
      eventType: "payment.refunded",
      payload: {
        paymentId: result[0]!.id,
        bookingId,
        amount,
      },
    });

    return result[0]!;
  }

  async getByBookingId(bookingId: string): Promise<Payment[]> {
    return db
      .select()
      .from(payments)
      .where(eq(payments.bookingId, bookingId)) as Promise<Payment[]>;
  }

  async handleWebhookEvent(event: string, payload: any) {
    const entity = payload?.payment?.entity ?? payload?.refund?.entity;
    if (!entity) return;

    switch (event) {
      case "payment.captured": {
        const orderId = entity.order_id;
        if (!orderId) return;

        // Update payment record
        const updated = (await db
          .update(payments)
          .set({
            status: "captured",
            method: entity.method as "upi" | "card" | "netbanking" | "wallet" | null,
            gatewayReference: entity.id,
          })
          .where(eq(payments.gatewayReference, orderId))
          .returning()) as Payment[];

        // Confirm the booking — authoritative path (idempotent: only updates if still pending)
        if (updated.length > 0) {
          const payment = updated[0]!;
          const confirmedRows = await db
            .update(bookings)
            .set({
              status: "confirmed",
              version: sql`${bookings.version} + 1`,
            })
            .where(
              and(
                eq(bookings.id, payment.bookingId),
                eq(bookings.status, "pending")
              )
            )
            .returning();

          if (confirmedRows.length > 0) {
            const booking = confirmedRows[0];
            await db.insert(bookingEvents).values({
              bookingId: payment.bookingId,
              eventType: "payment_captured",
              data: {
                paymentId: entity.id,
                orderId,
                source: "webhook",
              },
              actorId: payment.userId,
              actorType: "user",
            });

            await db.insert(outboxEvents).values({
              eventType: "booking.confirmed",
              payload: {
                bookingId: payment.bookingId,
                vehicleId: booking.vehicleId,
                renterId: booking.renterId,
                hostId: booking.hostId,
              },
            });
          }
        }
        break;
      }
      case "payment.failed": {
        const orderId = entity.order_id;
        if (!orderId) return;

        // Only mark as failed if not already captured (prevent out-of-order overwrites)
        await db
          .update(payments)
          .set({ status: "failed" })
          .where(
            and(
              eq(payments.gatewayReference, orderId),
              eq(payments.status, "pending")
            )
          );
        break;
      }
      case "refund.processed": {
        break;
      }
    }
  }
}

export const paymentService = new PaymentService();
