import { StarRating } from "./star-rating";

interface ReviewCardProps {
  review: {
    id: string;
    rating: number;
    subRatings: Record<string, number> | null;
    text: string | null;
    createdAt: string;
    reviewerId: string;
  };
}

const SUB_RATING_LABELS: Record<string, string> = {
  cleanliness: "Cleanliness",
  accuracy: "Accuracy",
  communication: "Communication",
  value: "Value",
};

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const subs = (review.subRatings ?? {}) as Record<string, number>;
  const hasSubRatings = Object.keys(subs).length > 0;

  return (
    <div className="border-b border-[#F0EFEC] last:border-b-0 py-5 first:pt-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#F0EFEC] flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-[#999]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0" />
            </svg>
          </div>
          <div>
            <StarRating rating={review.rating} readonly size="sm" />
            <p className="text-xs text-[#999] mt-0.5">{timeAgo(review.createdAt)}</p>
          </div>
        </div>
      </div>

      {review.text && (
        <p className="text-sm text-[#6B6B6B] mt-3 leading-relaxed">{review.text}</p>
      )}

      {hasSubRatings && (
        <div className="flex flex-wrap gap-3 mt-3">
          {Object.entries(subs).map(([key, val]) => (
            <span
              key={key}
              className="inline-flex items-center gap-1 text-xs text-[#6B6B6B] bg-[#FAFAF8] rounded-full px-2.5 py-1"
            >
              {SUB_RATING_LABELS[key] ?? key}
              <span className="text-amber-500">&#9733;</span>
              {val}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
