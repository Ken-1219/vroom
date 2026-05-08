import { db } from "@/lib/db";
import { payments, type Payment } from "@vroom/db/schema";
import { eq } from "drizzle-orm";
import { getRazorpay, verifyPaymentSignature } from "@/lib/razorpay";
import { eventBus } from "@vroom/events";

export class PaymentService {
  async createOrder(
    bookingId: string,
    amount: number,
    currency: string,
    userId: string
  ) {
    const razorpay = getRazorpay();

    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt: bookingId,
      notes: { bookingId, userId },
    });

    const idempotencyKey = `order_${bookingId}_${Date.now()}`;

    const result = (await (db as any)
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

    const updated = (await (db as any)
      .update(payments)
      .set({
        status: "captured",
        gatewayReference: razorpayPaymentId,
        method,
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

    eventBus.publish("payment.captured", {
      paymentId: payment.id,
      bookingId: payment.bookingId,
      amount: payment.amount,
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

    const idempotencyKey = `refund_${bookingId}_${Date.now()}`;

    const result = (await (db as any)
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

    eventBus.publish("payment.refunded", {
      paymentId: result[0]!.id,
      bookingId,
      amount,
    });

    return result[0]!;
  }

  async getByBookingId(bookingId: string): Promise<Payment[]> {
    return (db as any)
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

        await (db as any)
          .update(payments)
          .set({
            status: "captured",
            method: entity.method,
            gatewayReference: entity.id,
          })
          .where(eq(payments.gatewayReference, orderId));
        break;
      }
      case "payment.failed": {
        const orderId = entity.order_id;
        if (!orderId) return;

        await (db as any)
          .update(payments)
          .set({ status: "failed" })
          .where(eq(payments.gatewayReference, orderId));
        break;
      }
      case "refund.processed": {
        // Refund already recorded via processRefund, this is a confirmation
        break;
      }
    }
  }
}

export const paymentService = new PaymentService();
