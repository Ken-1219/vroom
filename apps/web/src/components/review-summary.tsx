"use client";

import { useState, useEffect } from "react";

interface ReviewSummaryProps {
  vehicleId: string;
  totalReviews: number;
}

export function ReviewSummary({ vehicleId, totalReviews }: ReviewSummaryProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (totalReviews < 3) return;

    setLoading(true);
    fetch(`/api/reviews/summary?vehicleId=${vehicleId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.summary) setSummary(data.summary);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [vehicleId, totalReviews]);

  if (totalReviews < 3) return null;
  if (!loading && !summary) return null;

  return (
    <div className="mb-6 p-4 bg-[#FFF8F5] border border-[#FF4D00]/20 rounded-xl">
      <div className="flex items-start gap-2.5">
        <div className="flex-shrink-0 mt-0.5">
          <svg className="w-4 h-4 text-[#FF4D00]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-[#FF4D00] mb-1">AI Review Summary</p>
          {loading ? (
            <div className="space-y-1.5">
              <div className="h-3 bg-[#F0EFEC] rounded animate-pulse w-full" />
              <div className="h-3 bg-[#F0EFEC] rounded animate-pulse w-4/5" />
              <div className="h-3 bg-[#F0EFEC] rounded animate-pulse w-3/5" />
            </div>
          ) : summary ? (
            <div>
              <p className={`text-sm text-[#4A4A4A] leading-relaxed ${!expanded && summary.length > 200 ? "line-clamp-2" : ""}`}>
                {summary}
              </p>
              {summary.length > 200 && (
                <button
                  onClick={() => setExpanded((e) => !e)}
                  className="text-xs text-[#FF4D00] hover:text-[#E64500] mt-1 font-medium cursor-pointer"
                >
                  {expanded ? "Show less" : "Read more"}
                </button>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
