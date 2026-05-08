import { db } from "@/lib/db";
import { reviews, type Review } from "@vroom/db/schema";
import { vehicles } from "@vroom/db/schema";
import { eq, and, desc, sql, avg, count } from "drizzle-orm";
import { eventBus } from "@vroom/events";
import type { CreateReviewInput } from "@vroom/validators";

export class ReviewService {
  async create(input: CreateReviewInput, reviewerId: string): Promise<Review> {
    const review = (await (db as any)
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

    const created = review[0]!;

    if (input.vehicleId) {
      await this.updateVehicleRating(input.vehicleId);
    }

    eventBus.publish("review.created", {
      reviewId: created.id,
      bookingId: input.bookingId,
      vehicleId: input.vehicleId ?? null,
      rating: input.rating,
    });

    return created;
  }

  async getByVehicle(vehicleId: string, limit = 20, offset = 0) {
    const rows = (await (db as any)
      .select()
      .from(reviews)
      .where(and(eq(reviews.vehicleId, vehicleId), eq(reviews.status, "published")))
      .orderBy(desc(reviews.createdAt))
      .limit(limit)
      .offset(offset)) as Review[];

    const statsResult = (await (db as any)
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
    return (db as any)
      .select()
      .from(reviews)
      .where(eq(reviews.bookingId, bookingId))
      .orderBy(desc(reviews.createdAt)) as Promise<Review[]>;
  }

  async hasReviewed(bookingId: string, reviewerId: string): Promise<boolean> {
    const rows = (await (db as any)
      .select({ id: reviews.id })
      .from(reviews)
      .where(
        and(eq(reviews.bookingId, bookingId), eq(reviews.reviewerId, reviewerId))
      )
      .limit(1)) as { id: string }[];
    return rows.length > 0;
  }

  private async updateVehicleRating(vehicleId: string) {
    const result = (await (db as any)
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
      await (db as any)
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
