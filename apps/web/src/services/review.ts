import { db } from "@/lib/db";
import { reviews, vehicles, users, outboxEvents, type Review } from "@vroom/db/schema";
import { eq, and, desc, avg, count } from "drizzle-orm";
import type { CreateReviewInput } from "@vroom/validators";

const PROFANITY_LIST = [
  "ass",
  "asshole",
  "bastard",
  "bitch",
  "bollocks",
  "bullshit",
  "crap",
  "cunt",
  "damn",
  "dick",
  "douchebag",
  "fag",
  "fuck",
  "goddamn",
  "hell",
  "idiot",
  "jackass",
  "motherfucker",
  "nigger",
  "piss",
  "prick",
  "pussy",
  "shit",
  "slut",
  "twat",
  "wanker",
  "whore",
];

function containsProfanity(text: string): boolean {
  const lower = text.toLowerCase();
  return PROFANITY_LIST.some((word) => {
    const pattern = new RegExp(`\\b${word}\\b`, "i");
    return pattern.test(lower);
  });
}

export class ReviewService {
  async create(input: CreateReviewInput, reviewerId: string): Promise<Review> {
    const review = (await db
      .insert(reviews)
      .values({
        bookingId: input.bookingId,
        reviewerId,
        vehicleId: input.vehicleId ?? null,
        revieweeId: null,
        type: input.type,
        rating: input.rating,
        subRatings: input.subRatings ?? null,
        text: input.text ?? null,
        status: "published",
      })
      .returning()) as Review[];

    let created = review[0]!;

    // Auto-flag check
    const flagReason = await this.checkAutoFlag(created, reviewerId);
    if (flagReason) {
      const flagged = (await db
        .update(reviews)
        .set({ status: "flagged" })
        .where(eq(reviews.id, created.id))
        .returning()) as Review[];
      created = flagged[0]!;

      await db.insert(outboxEvents).values({
        eventType: "review.auto_flagged",
        payload: {
          reviewId: created.id,
          reason: flagReason,
        },
      });
    }

    if (input.vehicleId) {
      await this.updateVehicleRating(input.vehicleId);
    }

    await db.insert(outboxEvents).values({
      eventType: "review.created",
      payload: {
        reviewId: created.id,
        bookingId: input.bookingId,
        vehicleId: input.vehicleId ?? null,
        rating: input.rating,
      },
    });

    return created;
  }

  async getByVehicle(vehicleId: string, limit = 20, offset = 0) {
    const rows = (await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.vehicleId, vehicleId), eq(reviews.status, "published")))
      .orderBy(desc(reviews.createdAt))
      .limit(limit)
      .offset(offset)) as Review[];

    const statsResult = (await db
      .select({ total: count(), avgRating: avg(reviews.rating) })
      .from(reviews)
      .where(
        and(eq(reviews.vehicleId, vehicleId), eq(reviews.status, "published"))
      )) as { total: number; avgRating: string | null }[];

    const stats = statsResult[0];
    return {
      reviews: rows,
      total: stats?.total ?? 0,
      avgRating: stats?.avgRating ? parseFloat(stats.avgRating) : null,
    };
  }

  async getByBooking(bookingId: string): Promise<Review[]> {
    return db
      .select()
      .from(reviews)
      .where(eq(reviews.bookingId, bookingId))
      .orderBy(desc(reviews.createdAt)) as Promise<Review[]>;
  }

  async hasReviewed(bookingId: string, reviewerId: string): Promise<boolean> {
    const rows = (await db
      .select({ id: reviews.id })
      .from(reviews)
      .where(
        and(eq(reviews.bookingId, bookingId), eq(reviews.reviewerId, reviewerId))
      )
      .limit(1)) as { id: string }[];
    return rows.length > 0;
  }

  async flagReview(reviewId: string, reason: string): Promise<Review> {
    const result = (await db
      .update(reviews)
      .set({ status: "flagged" })
      .where(eq(reviews.id, reviewId))
      .returning()) as Review[];

    if (result.length === 0) {
      throw new Error("Review not found");
    }

    await db.insert(outboxEvents).values({
      eventType: "review.flagged",
      payload: { reviewId, reason },
    });

    return result[0]!;
  }

  async hideReview(reviewId: string, reason: string): Promise<Review> {
    const result = (await db
      .update(reviews)
      .set({ status: "hidden" })
      .where(eq(reviews.id, reviewId))
      .returning()) as Review[];

    if (result.length === 0) {
      throw new Error("Review not found");
    }

    // Recalculate vehicle rating since hidden reviews should not count
    const hidden = result[0]!;
    if (hidden.vehicleId) {
      await this.updateVehicleRating(hidden.vehicleId);
    }

    await db.insert(outboxEvents).values({
      eventType: "review.hidden",
      payload: { reviewId, reason },
    });

    return hidden;
  }

  async publishReview(reviewId: string): Promise<Review> {
    const result = (await db
      .update(reviews)
      .set({ status: "published" })
      .where(eq(reviews.id, reviewId))
      .returning()) as Review[];

    if (result.length === 0) {
      throw new Error("Review not found");
    }

    const published = result[0]!;
    if (published.vehicleId) {
      await this.updateVehicleRating(published.vehicleId);
    }

    await db.insert(outboxEvents).values({
      eventType: "review.published",
      payload: { reviewId },
    });

    return published;
  }

  async getFlaggedReviews(limit = 50) {
    return (await db
      .select()
      .from(reviews)
      .where(eq(reviews.status, "flagged"))
      .orderBy(desc(reviews.createdAt))
      .limit(limit)) as Review[];
  }

  async getAllForModeration(
    status?: "published" | "hidden" | "flagged",
    limit = 50
  ) {
    const conditions = status ? [eq(reviews.status, status)] : [];

    const rows = await db
      .select({
        id: reviews.id,
        bookingId: reviews.bookingId,
        reviewerId: reviews.reviewerId,
        revieweeId: reviews.revieweeId,
        vehicleId: reviews.vehicleId,
        type: reviews.type,
        rating: reviews.rating,
        subRatings: reviews.subRatings,
        text: reviews.text,
        status: reviews.status,
        createdAt: reviews.createdAt,
        reviewerName: users.name,
        vehicleMake: vehicles.make,
        vehicleModel: vehicles.model,
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.reviewerId, users.id))
      .leftJoin(vehicles, eq(reviews.vehicleId, vehicles.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(reviews.createdAt))
      .limit(limit);

    return rows;
  }

  private async checkAutoFlag(
    review: Review,
    reviewerId: string
  ): Promise<string | null> {
    // Check profanity
    if (review.text && containsProfanity(review.text)) {
      return "Contains inappropriate language";
    }

    // Check suspiciously short text with extreme rating
    if (
      review.text &&
      review.text.length < 5 &&
      (review.rating === 1 || review.rating === 5)
    ) {
      return "Suspiciously short review with extreme rating";
    }

    // Check reviewer trust score
    const reviewer = (await db
      .select({ trustScore: users.trustScore })
      .from(users)
      .where(eq(users.id, reviewerId))
      .limit(1)) as { trustScore: string | null }[];

    if (reviewer[0]?.trustScore) {
      const score = parseFloat(reviewer[0].trustScore);
      if (score < 0.2) {
        return "Reviewer has low trust score";
      }
    }

    return null;
  }

  private async updateVehicleRating(vehicleId: string) {
    const result = (await db
      .select({
        avgRating: avg(reviews.rating),
        reviewCount: count(),
      })
      .from(reviews)
      .where(
        and(eq(reviews.vehicleId, vehicleId), eq(reviews.status, "published"))
      )) as { avgRating: string | null; reviewCount: number }[];

    const stats = result[0];
    if (stats) {
      await db
        .update(vehicles)
        .set({
          ratingAvg: stats.avgRating ?? "0",
          reviewCount: stats.reviewCount,
        })
        .where(eq(vehicles.id, vehicleId));
    }
  }
}

export const reviewService = new ReviewService();
