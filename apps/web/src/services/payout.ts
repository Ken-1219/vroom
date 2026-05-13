import { db } from "@/lib/db";
import {
  payouts,
  payments,
  bookings,
  type Payout,
} from "@vroom/db/schema";
import { eq, and, between, desc, sql } from "drizzle-orm";

const PLATFORM_FEE_PCT = 15;

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
}

export const payoutService = new PayoutService();
