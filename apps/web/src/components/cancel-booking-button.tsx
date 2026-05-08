"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "./ui/modal";

interface CancelBookingButtonProps {
  bookingId: string;
}

export function CancelBookingButton({ bookingId }: CancelBookingButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState("");

  async function handleCancel() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", reason: reason || "Cancelled by user" }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message ?? "Failed to cancel booking");
      }

      setShowModal(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {error && (
        <p className="text-sm text-red-600 mb-2">{error}</p>
      )}
      <button
        onClick={() => setShowModal(true)}
        className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
      >
        Cancel Booking
      </button>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Cancel Booking"
        actions={
          <>
            <button
              onClick={() => setShowModal(false)}
              className="px-4 py-2 text-sm text-[#6B6B6B] hover:text-[#1A1A1A] font-medium rounded-lg transition-colors cursor-pointer"
            >
              Keep Booking
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-red-300 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? "Cancelling..." : "Confirm Cancel"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-[#6B6B6B]">
            Are you sure you want to cancel this booking? Refund amounts depend on how far in advance you cancel.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-800">
              <strong>Cancellation policy:</strong> Full refund if cancelled 48+ hours before start.
              75% for 24-48 hours, 50% for 6-24 hours, no refund within 6 hours.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
              Reason <span className="text-[#999] font-normal">(optional)</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why are you cancelling?"
              rows={2}
              maxLength={500}
              className="w-full rounded-lg border border-[#E8E6E1] px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#999] focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 resize-none"
            />
          </div>
        </div>
      </Modal>
    </>
  );
}
