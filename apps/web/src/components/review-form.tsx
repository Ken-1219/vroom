"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StarRating } from "./star-rating";

interface ReviewFormProps {
  bookingId: string;
  vehicleId: string;
  vehicleName: string;
}

const SUB_RATING_LABELS: Record<string, string> = {
  cleanliness: "Cleanliness",
  accuracy: "Accuracy",
  communication: "Communication",
  value: "Value for Money",
};

export function ReviewForm({ bookingId, vehicleId, vehicleName }: ReviewFormProps) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [subRatings, setSubRatings] = useState<Record<string, number>>({});
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError("Please select an overall rating");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          vehicleId,
          type: "renter_to_vehicle",
          rating,
          subRatings: Object.keys(subRatings).length > 0 ? subRatings : undefined,
          text: text.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message ?? "Failed to submit review");
      }

      router.push(`/bookings/${bookingId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Overall Rating */}
      <div>
        <label className="block text-sm font-semibold text-[#1A1A1A] mb-3">
          Overall Rating
        </label>
        <div className="flex items-center gap-3">
          <StarRating rating={rating} onChange={setRating} size="lg" />
          {rating > 0 && (
            <span className="text-sm text-[#6B6B6B] font-medium">
              {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating]}
            </span>
          )}
        </div>
      </div>

      {/* Sub Ratings */}
      <div>
        <label className="block text-sm font-semibold text-[#1A1A1A] mb-4">
          Rate specific aspects <span className="text-[#999] font-normal">(optional)</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Object.entries(SUB_RATING_LABELS).map(([key, label]) => (
            <div
              key={key}
              className="flex items-center justify-between bg-[#FAFAF8] rounded-lg px-4 py-3"
            >
              <span className="text-sm text-[#1A1A1A]">{label}</span>
              <StarRating
                rating={subRatings[key] ?? 0}
                onChange={(val) =>
                  setSubRatings((prev) => ({ ...prev, [key]: val }))
                }
                size="sm"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Text Review */}
      <div>
        <label className="block text-sm font-semibold text-[#1A1A1A] mb-2">
          Your Review <span className="text-[#999] font-normal">(optional)</span>
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Share your experience with the ${vehicleName}...`}
          rows={4}
          maxLength={2000}
          className="w-full rounded-lg border border-[#E8E6E1] px-4 py-3 text-sm text-[#1A1A1A] placeholder:text-[#999] focus:outline-none focus:ring-2 focus:ring-[#FF4D00]/20 focus:border-[#FF4D00] resize-none"
        />
        <p className="text-xs text-[#999] mt-1 text-right">{text.length}/2000</p>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || rating === 0}
          className="px-6 py-2.5 bg-[#FF4D00] hover:bg-[#E64500] disabled:bg-[#E8E6E1] text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          {submitting ? "Submitting..." : "Submit Review"}
        </button>
      </div>
    </form>
  );
}
