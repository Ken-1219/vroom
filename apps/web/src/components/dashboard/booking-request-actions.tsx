"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function BookingRequestActions({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"accept" | "reject" | null>(null);
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");

  async function handleAction(action: "accept" | "reject") {
    setLoading(action);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          ...(action === "reject" && { reason: reason || "Host declined the request" }),
        }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(null);
      setShowReject(false);
    }
  }

  if (showReject) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason (optional)"
          className="px-3 py-1.5 border border-[#E8E6E1] rounded-md text-sm w-40 focus:outline-none focus:ring-2 focus:ring-red-500/30"
        />
        <button
          onClick={() => handleAction("reject")}
          disabled={!!loading}
          className="text-xs font-medium text-white bg-red-600 hover:bg-red-500 px-3 py-1.5 rounded-md cursor-pointer disabled:opacity-50"
        >
          {loading === "reject" ? "..." : "Confirm"}
        </button>
        <button
          onClick={() => setShowReject(false)}
          className="text-xs text-[#6B6B6B] hover:text-[#1A1A1A] cursor-pointer"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleAction("accept")}
        disabled={!!loading}
        className="text-xs font-medium text-white bg-[#FF4D00] hover:bg-[#E64500] px-4 py-1.5 rounded-md cursor-pointer disabled:opacity-50"
      >
        {loading === "accept" ? "..." : "Accept"}
      </button>
      <button
        onClick={() => setShowReject(true)}
        disabled={!!loading}
        className="text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 px-4 py-1.5 rounded-md cursor-pointer disabled:opacity-50"
      >
        Reject
      </button>
    </div>
  );
}
