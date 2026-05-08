"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { openRazorpayCheckout } from "@/lib/razorpay-client";
import { useToast } from "@/components/ui/toast-context";
import Link from "next/link";

interface BookingData {
  id: string;
  status: string;
  vehicleId: string;
  vehicleName: string;
  vehiclePhoto: string | null;
  startDate: string;
  endDate: string;
  totalAmount: number;
  currency: string;
  pickupAddress: string | null;
}

export default function PayBookingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const { toast } = useToast();

  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authStatus === "loading") return;
    if (!session?.user) {
      router.replace("/login");
      return;
    }

    fetch(`/api/bookings/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed to load booking"))))
      .then((data) => setBooking(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, session, authStatus, router]);

  const handlePay = useCallback(async () => {
    if (!booking || paying) return;
    setPaying(true);
    setError(null);

    try {
      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id }),
      });

      if (!orderRes.ok) {
        const data = await orderRes.json();
        throw new Error(data.error?.message ?? "Failed to create payment order");
      }

      const { orderId, amount, currency, key } = await orderRes.json();

      const rzpResponse = await openRazorpayCheckout({
        key,
        amount,
        currency,
        name: "Vroom",
        description: `Booking: ${booking.vehicleName}`,
        order_id: orderId,
        prefill: {
          name: session?.user?.name ?? undefined,
          email: session?.user?.email ?? undefined,
        },
        theme: { color: "#FF4D00" },
      });

      const verifyRes = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          razorpay_payment_id: rzpResponse.razorpay_payment_id,
          razorpay_order_id: rzpResponse.razorpay_order_id,
          razorpay_signature: rzpResponse.razorpay_signature,
        }),
      });

      if (!verifyRes.ok) {
        throw new Error("Payment verification failed");
      }

      toast("Payment successful!", "success");
      router.replace(`/bookings/${booking.id}/confirmation`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";

      if (message === "Payment cancelled by user") {
        toast("Payment was cancelled. You can try again.", "info");
      } else {
        try {
          await fetch(`/api/bookings/${booking.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "cancel", reason: `Payment failed: ${message}` }),
          });
        } catch {
          // best-effort
        }
        toast(message, "error");
        setError(message);
      }
    } finally {
      setPaying(false);
    }
  }, [booking, paying, session, router, toast]);

  if (authStatus === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#FFF1EB] rounded-full mb-4">
            <svg className="animate-spin h-8 w-8 text-[#FF4D00]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <p className="text-[#6B6B6B] text-sm">Loading booking...</p>
        </div>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center px-6">
        <div className="bg-white border border-[#E8E6E1] rounded-xl p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-[#1A1A1A] mb-2">Could not load booking</h2>
          <p className="text-sm text-[#6B6B6B] mb-6">{error}</p>
          <Link href="/bookings" className="text-sm font-medium text-[#FF4D00] hover:underline">
            Go to My Bookings
          </Link>
        </div>
      </div>
    );
  }

  if (!booking) return null;

  if (booking.status !== "pending") {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center px-6">
        <div className="bg-white border border-[#E8E6E1] rounded-xl p-8 max-w-md w-full text-center">
          <h2 className="text-lg font-bold text-[#1A1A1A] mb-2">
            {booking.status === "confirmed" ? "Already Paid" : `Booking is ${booking.status}`}
          </h2>
          <p className="text-sm text-[#6B6B6B] mb-6">
            {booking.status === "confirmed"
              ? "This booking has already been paid for."
              : "This booking can no longer be paid for."}
          </p>
          <Link
            href={`/bookings/${booking.id}`}
            className="inline-block text-sm font-medium text-white bg-[#FF4D00] hover:bg-[#E64500] px-5 py-2.5 rounded-lg transition-colors"
          >
            View Booking
          </Link>
        </div>
      </div>
    );
  }

  const startDate = new Date(booking.startDate);
  const endDate = new Date(booking.endDate);
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const formattedTotal = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(booking.totalAmount / 100);

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center px-6 py-12">
      <div className="bg-white border border-[#E8E6E1] rounded-xl overflow-hidden max-w-md w-full shadow-sm">
        {/* Header */}
        <div className="bg-[#0D0D0D] px-6 py-5 text-center">
          <p className="text-xs text-white/40 uppercase tracking-wider font-medium mb-1">Complete Payment</p>
          <p className="text-3xl font-bold text-white">₹{formattedTotal}</p>
        </div>

        {/* Booking Details */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            {booking.vehiclePhoto ? (
              <img src={booking.vehiclePhoto} alt={booking.vehicleName} className="w-20 h-14 object-cover rounded-lg" />
            ) : (
              <div className="w-20 h-14 bg-[#F0EFEC] rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-[#999]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>
              </div>
            )}
            <div>
              <h2 className="font-semibold text-[#1A1A1A]">{booking.vehicleName}</h2>
              {booking.pickupAddress && (
                <p className="text-xs text-[#6B6B6B] mt-0.5">{booking.pickupAddress}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 py-3 border-y border-[#F0EFEC]">
            <div>
              <p className="text-[10px] font-medium text-[#999] uppercase tracking-wider">Pick-up</p>
              <p className="text-sm font-medium text-[#1A1A1A] mt-0.5">
                {startDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-medium text-[#999] uppercase tracking-wider">Drop-off</p>
              <p className="text-sm font-medium text-[#1A1A1A] mt-0.5">
                {endDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-[#6B6B6B]">{days} day{days !== 1 ? "s" : ""}</span>
            <span className="font-semibold text-[#1A1A1A]">₹{formattedTotal}</span>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            onClick={handlePay}
            disabled={paying}
            className="w-full px-6 py-3 bg-[#FF4D00] hover:bg-[#E64500] disabled:bg-[#E8E6E1] disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors cursor-pointer"
          >
            {paying ? (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Processing...
              </span>
            ) : (
              `Pay ₹${formattedTotal}`
            )}
          </button>

          <div className="flex items-center justify-center gap-2 text-xs text-[#999]">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Secure payment via Razorpay
          </div>
        </div>
      </div>
    </div>
  );
}
