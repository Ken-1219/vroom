"use client";

import { useState, useEffect } from "react";
import { ReviewCard } from "./review-card";
import { StarRating } from "./star-rating";

interface Review {
  id: string;
  rating: number;
  subRatings: Record<string, number> | null;
  text: string | null;
  createdAt: string;
  reviewerId: string;
}

interface ReviewListProps {
  vehicleId: string;
}

export function ReviewList({ vehicleId }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [ratingAvg, setRatingAvg] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 10;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reviews?vehicleId=${vehicleId}&limit=${limit}&offset=${offset}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          if (offset === 0) {
            setReviews(data.reviews);
          } else {
            setReviews((prev) => [...prev, ...data.reviews]);
          }
          setTotal(data.total);
          if (data.avgRating != null) {
            setRatingAvg(data.avgRating);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [vehicleId, offset]);

  if (loading && total === null) {
    return (
      <div className="py-6 text-center text-sm text-[#999]">
        Loading reviews...
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-[#999]">No reviews yet</p>
      </div>
    );
  }

  return (
    <div>
      {/* Summary */}
      {ratingAvg !== null && total !== null && (
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl font-bold text-[#1A1A1A]">
            {ratingAvg.toFixed(1)}
          </span>
          <div>
            <StarRating rating={Math.round(ratingAvg)} readonly size="sm" />
            <p className="text-xs text-[#999] mt-0.5">
              {total} review{total !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      )}

      {/* Review items */}
      <div>
        {reviews.map((r) => (
          <ReviewCard key={r.id} review={r} />
        ))}
      </div>

      {loading && (
        <div className="py-4 text-center text-sm text-[#999]">Loading...</div>
      )}

      {!loading && total !== null && reviews.length < total && (
        <button
          onClick={() => setOffset((prev) => prev + limit)}
          className="mt-4 text-sm text-[#FF4D00] hover:text-[#E64500] font-medium cursor-pointer"
        >
          Show more reviews
        </button>
      )}
    </div>
  );
}
