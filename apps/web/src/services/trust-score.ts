import { db } from "@/lib/db";
import { users, bookings, reviews, payments } from "@vroom/db/schema";
import { eq, and, sql, count } from "drizzle-orm";
import { logger } from "@/lib/logger";

/** Rating-based trust score deltas. */
const RATING_DELTAS: Record<number, number> = {
  5: 0.03,
  4: 0.01,
  3: 0,
  2: -0.02,
  1: -0.05,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export class TrustScoreService {
  /**
   * Full recalculation of a user's trust score from all historical data.
   * Starts from base 0.50 and applies every factor.
   */
  async recalculateScore(userId: string): Promise<number> {
    const [user] = (await db
      .select({ id: users.id, createdAt: users.createdAt })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)) as { id: string; createdAt: Date | null }[];

    if (!user) {
      throw new Error("User not found");
    }

    let score = 0.5;

    // --- Completed bookings (as renter or host): +0.02 each, max +0.20 ---
    const [completedResult] = (await db
      .select({ total: count() })
      .from(bookings)
      .where(
        and(
          sql`(${bookings.renterId} = ${userId} OR ${bookings.hostId} = ${userId})`,
          eq(bookings.status, "completed")
        )
      )) as { total: number }[];

    const completedCount = completedResult?.total ?? 0;
    score += Math.min(completedCount * 0.02, 0.2);

    // --- Cancellations by this user ---
    const cancelledRows = (await db
      .select({
        startDate: bookings.startDate,
        cancelledAt: bookings.cancelledAt,
      })
      .from(bookings)
      .where(
        and(
          eq(bookings.cancelledBy, userId),
          eq(bookings.status, "cancelled")
        )
      )) as { startDate: Date; cancelledAt: Date | null }[];

    for (const row of cancelledRows) {
      const cancelTime = row.cancelledAt
        ? new Date(row.cancelledAt).getTime()
        : Date.now();
      const startTime = new Date(row.startDate).getTime();
      const hoursUntilStart = (startTime - cancelTime) / (1000 * 60 * 60);

      if (hoursUntilStart < 24) {
        score -= 0.1; // late cancellation
      } else {
        score -= 0.05;
      }
    }

    // --- Reviews received: rating-based delta ---
    const reviewRows = (await db
      .select({ rating: reviews.rating })
      .from(reviews)
      .where(eq(reviews.revieweeId, userId))) as { rating: number }[];

    for (const row of reviewRows) {
      score += RATING_DELTAS[row.rating] ?? 0;
    }

    // --- Payment failures ---
    const [failedPayments] = (await db
      .select({ total: count() })
      .from(payments)
      .where(
        and(eq(payments.userId, userId), eq(payments.status, "failed"))
      )) as { total: number }[];

    score -= (failedPayments?.total ?? 0) * 0.05;

    // --- Account age: +0.01 per 30 days, max +0.10 ---
    if (user.createdAt) {
      const ageMs = Date.now() - new Date(user.createdAt).getTime();
      const ageDays = ageMs / (1000 * 60 * 60 * 24);
      const ageBonus = Math.floor(ageDays / 30) * 0.01;
      score += Math.min(ageBonus, 0.1);
    }

    // Clamp to [0.00, 1.00]
    score = clamp(score, 0, 1);

    // Persist
    await db
      .update(users)
      .set({ trustScore: score.toFixed(2), updatedAt: new Date() })
      .where(eq(users.id, userId));

    logger.info("Trust score recalculated", { userId, score });

    return score;
  }

  /**
   * Quick delta adjustment without a full recalculation.
   */
  async applyScoreDelta(
    userId: string,
    delta: number,
    reason: string
  ): Promise<number> {
    const [user] = (await db
      .select({ trustScore: users.trustScore })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)) as { trustScore: string | null }[];

    if (!user) {
      throw new Error("User not found");
    }

    const current = parseFloat(user.trustScore ?? "0.50");
    const updated = clamp(current + delta, 0, 1);

    await db
      .update(users)
      .set({ trustScore: updated.toFixed(2), updatedAt: new Date() })
      .where(eq(users.id, userId));

    logger.info("Trust score delta applied", {
      userId,
      delta,
      reason,
      previous: current,
      updated,
    });

    return updated;
  }

  /**
   * Auto-moderate a user based on their trust score.
   * - Below 0.15 -> suspended
   * - Below 0.05 -> banned
   */
  async checkAutoModeration(userId: string): Promise<void> {
    const [user] = (await db
      .select({
        trustScore: users.trustScore,
        status: users.status,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)) as { trustScore: string | null; status: string | null }[];

    if (!user) return;

    const score = parseFloat(user.trustScore ?? "0.50");

    if (score < 0.05 && user.status !== "banned") {
      await db
        .update(users)
        .set({ status: "banned", updatedAt: new Date() })
        .where(eq(users.id, userId));
      logger.warn("User auto-banned due to low trust score", {
        userId,
        score,
      });
    } else if (score < 0.15 && user.status === "active") {
      await db
        .update(users)
        .set({ status: "suspended", updatedAt: new Date() })
        .where(eq(users.id, userId));
      logger.warn("User auto-suspended due to low trust score", {
        userId,
        score,
      });
    }
  }
}

export const trustScoreService = new TrustScoreService();
