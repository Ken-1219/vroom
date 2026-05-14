import { db } from "@/lib/db";
import {
  payouts,
  payments,
  bookings,
  type Payout,
} from "@vroom/db/schema";
import { eq, and, between, desc, sql } from "drizzle-orm";
import { ApiError } from "@/lib/api-error";
import { logger } from "@/lib/logger";

const PLATFORM_FEE_PCT = 15;

function getRazorpayAuth(): string {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new ApiError(500, "CONFIG_ERROR", "Razorpay credentials not configured");
  }
  return "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64");
}

function getRazorpayAccountNumber(): string {
  const accountNumber = process.env.RAZORPAY_ACCOUNT_NUMBER;
  if (!accountNumber) {
    throw new ApiError(
      500,
      "CONFIG_ERROR",
      "RAZORPAY_ACCOUNT_NUMBER not configured"
    );
  }
  return accountNumber;
}

export class PayoutService {
  async calculateHostEarnings(
    hostId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<{
    grossAmount: number;
    platformFee: number;
    netAmount: number;
    bookingIds: string[];
  }> {
    // Find all completed bookings for this host where the booking end date
    // falls within the payout period
    const completedBookings = (await db
      .select({ id: bookings.id })
      .from(bookings)
      .where(
        and(
          eq(bookings.hostId, hostId),
          eq(bookings.status, "completed"),
          between(bookings.endDate, periodStart, periodEnd)
        )
      )) as { id: string }[];

    if (completedBookings.length === 0) {
      return { grossAmount: 0, platformFee: 0, netAmount: 0, bookingIds: [] };
    }

    const bookingIds = completedBookings.map((b) => b.id);

    // Sum captured charges for these bookings
    const chargeResult = (await db
      .select({ total: sql<number>`COALESCE(SUM(${payments.amount}), 0)` })
      .from(payments)
      .where(
        and(
          sql`${payments.bookingId} IN ${bookingIds}`,
          eq(payments.type, "charge"),
          eq(payments.status, "captured")
        )
      )) as { total: number }[];

    // Sum refunds for these bookings
    const refundResult = (await db
      .select({ total: sql<number>`COALESCE(SUM(${payments.amount}), 0)` })
      .from(payments)
      .where(
        and(
          sql`${payments.bookingId} IN ${bookingIds}`,
          eq(payments.type, "refund")
        )
      )) as { total: number }[];

    const totalCharges = Number(chargeResult[0]?.total ?? 0);
    const totalRefunds = Number(refundResult[0]?.total ?? 0);
    const grossAmount = totalCharges - totalRefunds;
    const platformFee = Math.round((grossAmount * PLATFORM_FEE_PCT) / 100);
    const netAmount = grossAmount - platformFee;

    return { grossAmount, platformFee, netAmount, bookingIds };
  }

  async createPayout(
    hostId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<Payout> {
    const earnings = await this.calculateHostEarnings(
      hostId,
      periodStart,
      periodEnd
    );

    if (earnings.netAmount <= 0) {
      throw new Error("No earnings available for payout in this period");
    }

    const result = (await db
      .insert(payouts)
      .values({
        hostId,
        amount: earnings.grossAmount,
        status: "pending",
        platformFee: earnings.platformFee,
        netAmount: earnings.netAmount,
        periodStart: periodStart.toISOString().split("T")[0]!,
        periodEnd: periodEnd.toISOString().split("T")[0]!,
        bookingIds: earnings.bookingIds,
      })
      .returning()) as Payout[];

    return result[0]!;
  }

  async getByHost(hostId: string): Promise<Payout[]> {
    return db
      .select()
      .from(payouts)
      .where(eq(payouts.hostId, hostId))
      .orderBy(desc(payouts.createdAt)) as Promise<Payout[]>;
  }

  async getById(id: string): Promise<Payout | null> {
    const result = (await db
      .select()
      .from(payouts)
      .where(eq(payouts.id, id))
      .limit(1)) as Payout[];
    return result[0] ?? null;
  }

  /**
   * Creates a Razorpay fund account for a host's bank details.
   * In production this would be called during host onboarding.
   * Returns the fund_account_id from Razorpay.
   */
  async createFundAccount(contactId: string, bankDetails: {
    name: string;
    ifsc: string;
    accountNumber: string;
  }): Promise<string> {
    const authHeader = getRazorpayAuth();

    const response = await fetch("https://api.razorpay.com/v1/fund_accounts", {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contact_id: contactId,
        account_type: "bank_account",
        bank_account: {
          name: bankDetails.name,
          ifsc: bankDetails.ifsc,
          account_number: bankDetails.accountNumber,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error("Razorpay fund account creation failed", {
        status: response.status,
        error: data,
      });
      throw new ApiError(
        502,
        "GATEWAY_ERROR",
        "Failed to create fund account with payment gateway"
      );
    }

    return data.id as string;
  }

  /**
   * Processes a pending payout by calling the RazorpayX Payout API.
   *
   * Flow:
   * 1. Fetch and validate the payout record (must be "pending")
   * 2. Update status to "processing"
   * 3. Call RazorpayX POST /v1/payouts
   * 4. On success: status -> "completed", store gateway reference
   * 5. On failure: status -> "failed", store error in metadata
   */
  async processPayout(
    payoutId: string,
    fundAccountId?: string
  ): Promise<Payout> {
    // 1. Fetch the payout record
    const payout = await this.getById(payoutId);
    if (!payout) {
      throw new ApiError(404, "NOT_FOUND", "Payout not found");
    }

    if (payout.status !== "pending") {
      throw new ApiError(
        400,
        "INVALID_STATUS",
        `Payout is in "${payout.status}" status, expected "pending"`
      );
    }

    // Resolve fund_account_id: explicit param > metadata > env fallback
    const resolvedFundAccountId =
      fundAccountId ??
      (payout.metadata as Record<string, unknown> | null)?.fund_account_id as string | undefined ??
      process.env.RAZORPAY_DEFAULT_FUND_ACCOUNT_ID;

    if (!resolvedFundAccountId) {
      throw new ApiError(
        400,
        "MISSING_FUND_ACCOUNT",
        "No fund_account_id provided. Host bank account must be set up before payouts can be processed."
      );
    }

    // 2. Update status to "processing"
    await db
      .update(payouts)
      .set({ status: "processing" })
      .where(eq(payouts.id, payoutId));

    // 3. Call RazorpayX Payout API
    const authHeader = getRazorpayAuth();
    const accountNumber = getRazorpayAccountNumber();

    try {
      const response = await fetch("https://api.razorpay.com/v1/payouts", {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          account_number: accountNumber,
          fund_account_id: resolvedFundAccountId,
          amount: payout.netAmount,
          currency: payout.currency,
          mode: "NEFT",
          purpose: "payout",
          queue_if_low_balance: true,
          reference_id: payout.id,
          narration: `Vroom host payout ${payout.id.slice(0, 8)}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // 5. On failure: update status to "failed"
        logger.error("Razorpay payout API failed", {
          payoutId,
          status: response.status,
          error: data,
        });

        const updatedRows = (await db
          .update(payouts)
          .set({
            status: "failed",
            metadata: {
              ...(payout.metadata as Record<string, unknown> | null),
              razorpay_error: data?.error ?? data,
              failed_at: new Date().toISOString(),
            },
          })
          .where(eq(payouts.id, payoutId))
          .returning()) as Payout[];

        return updatedRows[0]!;
      }

      // 4. On success: update status to "completed"
      logger.info("Razorpay payout created", {
        payoutId,
        razorpayPayoutId: data.id,
        status: data.status,
      });

      // Razorpay may return status "processing" (async) or "processed" (instant)
      const isCompleted = data.status === "processed";

      const updatedRows = (await db
        .update(payouts)
        .set({
          status: isCompleted ? "completed" : "processing",
          gatewayReference: data.id,
          processedAt: isCompleted ? new Date() : null,
          metadata: {
            ...(payout.metadata as Record<string, unknown> | null),
            fund_account_id: resolvedFundAccountId,
            razorpay_status: data.status,
            razorpay_utr: data.utr ?? null,
          },
        })
        .where(eq(payouts.id, payoutId))
        .returning()) as Payout[];

      return updatedRows[0]!;
    } catch (error) {
      // Network/unexpected error — mark as failed
      logger.error("Razorpay payout request error", {
        payoutId,
        error: error instanceof Error ? error.message : String(error),
      });

      const updatedRows = (await db
        .update(payouts)
        .set({
          status: "failed",
          metadata: {
            ...(payout.metadata as Record<string, unknown> | null),
            razorpay_error: error instanceof Error ? error.message : String(error),
            failed_at: new Date().toISOString(),
          },
        })
        .where(eq(payouts.id, payoutId))
        .returning()) as Payout[];

      return updatedRows[0]!;
    }
  }

  /**
   * Handles incoming Razorpay payout webhook events.
   * Updates the payout status based on the event type.
   */
  async handleWebhookEvent(
    event: string,
    payload: Record<string, unknown>
  ): Promise<void> {
    const payoutEntity = (
      payload as { payout?: { entity?: Record<string, unknown> } }
    ).payout?.entity;

    if (!payoutEntity) {
      logger.warn("Payout webhook missing payout entity", { event });
      return;
    }

    const razorpayPayoutId = payoutEntity.id as string | undefined;
    const referenceId = payoutEntity.reference_id as string | undefined;

    if (!razorpayPayoutId) {
      logger.warn("Payout webhook missing payout id", { event });
      return;
    }

    // Look up the payout by gateway reference or reference_id (our payout ID)
    let payout: Payout | null = null;

    if (referenceId) {
      payout = await this.getById(referenceId);
    }

    if (!payout) {
      // Try by gatewayReference
      const rows = (await db
        .select()
        .from(payouts)
        .where(eq(payouts.gatewayReference, razorpayPayoutId))
        .limit(1)) as Payout[];
      payout = rows[0] ?? null;
    }

    if (!payout) {
      logger.warn("Payout webhook: no matching payout found", {
        event,
        razorpayPayoutId,
        referenceId,
      });
      return;
    }

    switch (event) {
      case "payout.processed": {
        await db
          .update(payouts)
          .set({
            status: "completed",
            processedAt: new Date(),
            metadata: {
              ...(payout.metadata as Record<string, unknown> | null),
              razorpay_status: "processed",
              razorpay_utr: payoutEntity.utr ?? null,
            },
          })
          .where(eq(payouts.id, payout.id));

        logger.info("Payout marked as completed via webhook", {
          payoutId: payout.id,
          razorpayPayoutId,
        });
        break;
      }

      case "payout.reversed": {
        await db
          .update(payouts)
          .set({
            status: "failed",
            metadata: {
              ...(payout.metadata as Record<string, unknown> | null),
              razorpay_status: "reversed",
              reversed_at: new Date().toISOString(),
              reversal_reason: payoutEntity.failure_reason ?? null,
            },
          })
          .where(eq(payouts.id, payout.id));

        logger.info("Payout marked as failed (reversed) via webhook", {
          payoutId: payout.id,
          razorpayPayoutId,
        });
        break;
      }

      case "payout.failed": {
        await db
          .update(payouts)
          .set({
            status: "failed",
            metadata: {
              ...(payout.metadata as Record<string, unknown> | null),
              razorpay_status: "failed",
              failure_reason: payoutEntity.failure_reason ?? null,
              failed_at: new Date().toISOString(),
            },
          })
          .where(eq(payouts.id, payout.id));

        logger.info("Payout marked as failed via webhook", {
          payoutId: payout.id,
          razorpayPayoutId,
        });
        break;
      }

      default:
        logger.info("Unhandled payout webhook event", { event });
    }
  }
}

export const payoutService = new PayoutService();
