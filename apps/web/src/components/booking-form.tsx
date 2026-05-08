"use client";

import { useState, useEffect, useCallback } from "react";
import { PlacesAutocomplete, type PlaceResult } from "./places-autocomplete";
import { ProtectionPlans } from "./protection-plans";
import { PriceBreakdown } from "./price-breakdown";
import { openRazorpayCheckout } from "@/lib/razorpay-client";
import { useSession } from "next-auth/react";
import { useToast } from "./ui/toast-context";

interface BookingFormProps {
  vehicleId: string;
  baseDailyRate: number;
  weekendRate?: number | null;
  weeklyDiscountPct?: number | null;
  monthlyDiscountPct?: number | null;
  currency: string;
  currencySymbol: string;
  formattedDailyRate: string;
  formattedWeekendRate?: string | null;
  vehicleCity: string;
  vehicleName: string;
  vehicleAddress: string;
  vehicleLatitude: number;
  vehicleLongitude: number;
}

function formatAmount(amount: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  }).format(amount);
}

const currencyMeta: Record<string, { symbol: string; locale: string }> = {
  INR: { symbol: "₹", locale: "en-IN" },
  USD: { symbol: "$", locale: "en-US" },
  EUR: { symbol: "€", locale: "en-DE" },
  GBP: { symbol: "£", locale: "en-GB" },
  AED: { symbol: "AED ", locale: "en-AE" },
  THB: { symbol: "฿", locale: "th-TH" },
  MYR: { symbol: "RM ", locale: "ms-MY" },
  SGD: { symbol: "S$", locale: "en-SG" },
};

const DELIVERY_FEE_PAISE = 14900; // ₹149 flat
const MAX_DELIVERY_KM = 3;

type Step = "form" | "payment" | "processing";

interface ServerBreakdown {
  days: number;
  weekdays: number;
  weekendDays: number;
  baseRate: number;
  weekdayTotal: number;
  weekendTotal: number;
  subtotal: number;
  weeklyDiscount: number;
  monthlyDiscount: number;
  protectionFee: number;
  protectionPlan: string;
  platformFee: number;
  tax: number;
  total: number;
  currency: string;
  perDayEffective: number;
}

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function BookingForm({
  vehicleId,
  baseDailyRate,
  weekendRate,
  weeklyDiscountPct,
  monthlyDiscountPct,
  currency,
  currencySymbol,
  formattedDailyRate,
  formattedWeekendRate,
  vehicleCity,
  vehicleName,
  vehicleAddress,
  vehicleLatitude,
  vehicleLongitude,
}: BookingFormProps) {
  const today = new Date().toISOString().split("T")[0]!;
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0]!;

  const { data: session } = useSession();
  const { toast } = useToast();
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(tomorrow);
  const [wantDelivery, setWantDelivery] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState<string | null>(null);
  const [deliveryLat, setDeliveryLat] = useState<number | null>(null);
  const [deliveryLng, setDeliveryLng] = useState<number | null>(null);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);
  const [deliveryDistance, setDeliveryDistance] = useState<number | null>(null);
  const [protectionPlan, setProtectionPlan] = useState<"basic" | "standard" | "premium">("basic");
  const [loading, setLoading] = useState(false);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("form");
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [breakdown, setBreakdown] = useState<ServerBreakdown | null>(null);
  const [promoInput, setPromoInput] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    description: string;
    discountPaise: number;
    discountFormatted: string;
  } | null>(null);

  const meta = currencyMeta[currency] ?? { symbol: currency + " ", locale: "en-US" };
  const fmt = useCallback(
    (n: number) => `${meta.symbol}${formatAmount(n, currency, meta.locale)}`,
    [meta.symbol, currency, meta.locale]
  );

  const deliveryFeeApplied = wantDelivery && deliveryLat !== null && !deliveryError;

  function handleDeliveryPlaceSelect(place: PlaceResult) {
    const dist = haversineDistance(vehicleLatitude, vehicleLongitude, place.lat, place.lng);
    setDeliveryLat(place.lat);
    setDeliveryLng(place.lng);
    setDeliveryAddress(place.address);
    setDeliveryDistance(dist);

    if (dist > MAX_DELIVERY_KM) {
      setDeliveryError(
        `This location is ${dist.toFixed(1)} km from the car. Delivery is only available within ${MAX_DELIVERY_KM} km.`
      );
    } else {
      setDeliveryError(null);
    }
  }

  function clearDelivery() {
    setDeliveryAddress(null);
    setDeliveryLat(null);
    setDeliveryLng(null);
    setDeliveryError(null);
    setDeliveryDistance(null);
  }

  useEffect(() => {
    if (!startDate || !endDate) {
      setBreakdown(null);
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) {
      setBreakdown(null);
      return;
    }

    const controller = new AbortController();
    setEstimateLoading(true);

    fetch("/api/pricing/estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vehicleId,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        protectionPlan,
      }),
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setBreakdown(data);
      })
      .catch((err) => {
        if (err.name !== "AbortError") setBreakdown(null);
      })
      .finally(() => setEstimateLoading(false));

    return () => controller.abort();
  }, [vehicleId, startDate, endDate, protectionPlan]);

  const totalWithDelivery = breakdown
    ? breakdown.total + (deliveryFeeApplied ? DELIVERY_FEE_PAISE : 0)
    : null;

  const promoDiscount = appliedPromo?.discountPaise ?? 0;
  const grandTotal = totalWithDelivery !== null ? totalWithDelivery - promoDiscount : null;

  async function applyPromo() {
    if (!promoInput.trim() || !breakdown) return;
    setPromoLoading(true);
    setPromoError(null);
    try {
      const res = await fetch("/api/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: promoInput.trim(),
          subtotalPaise: breakdown.total + (deliveryFeeApplied ? DELIVERY_FEE_PAISE : 0),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPromoError(data.error ?? "Invalid promo code");
        setAppliedPromo(null);
      } else {
        setAppliedPromo(data);
        setPromoError(null);
      }
    } catch {
      setPromoError("Failed to apply promo code");
    } finally {
      setPromoLoading(false);
    }
  }

  function removePromo() {
    setAppliedPromo(null);
    setPromoInput("");
    setPromoError(null);
  }

  async function handleConfirmBooking() {
    if (!breakdown) return;
    if (wantDelivery && deliveryError) return;

    setLoading(true);
    setError(null);

    try {
      const pickupAddr = wantDelivery && deliveryAddress ? deliveryAddress : vehicleAddress;
      const pickupLat = wantDelivery && deliveryLat ? deliveryLat : vehicleLatitude;
      const pickupLng = wantDelivery && deliveryLng ? deliveryLng : vehicleLongitude;

      const bookingRes = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
          protectionPlan,
          pickupLatitude: pickupLat,
          pickupLongitude: pickupLng,
          pickupAddress: pickupAddr,
          dropoffLatitude: vehicleLatitude,
          dropoffLongitude: vehicleLongitude,
          dropoffAddress: vehicleAddress,
          ...(deliveryFeeApplied && { deliveryFee: DELIVERY_FEE_PAISE }),
        }),
      });

      if (!bookingRes.ok) {
        const data = await bookingRes.json();
        throw new Error(data.error?.message ?? data.error ?? "Failed to create booking");
      }

      const booking = await bookingRes.json();
      setBookingId(booking.id);
      setStep("payment");

      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id }),
      });

      if (!orderRes.ok) {
        const data = await orderRes.json();
        throw new Error(data.error?.message ?? "Failed to create payment order");
      }

      const { orderId, amount, currency: orderCurrency, key } = await orderRes.json();
      setStep("processing");

      const rzpResponse = await openRazorpayCheckout({
        key,
        amount,
        currency: orderCurrency,
        name: "Vroom",
        description: `Booking: ${vehicleName}`,
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

      window.location.href = `/bookings/${booking.id}/confirmation`;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";

      if (bookingId) {
        try {
          await fetch(`/api/bookings/${bookingId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "cancel",
              reason: message === "Payment cancelled by user"
                ? "Payment cancelled by user"
                : `Payment failed: ${message}`,
            }),
          });
        } catch {
          // best-effort cancel
        }
        setBookingId(null);
      }

      if (message === "Payment cancelled by user") {
        toast("Payment was cancelled. You can try booking again.", "info");
        setError(null);
      } else {
        toast(message, "error");
        setError(message);
      }
      setStep("form");
    } finally {
      setLoading(false);
    }
  }

  if (step === "payment" || step === "processing") {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-[#FFF1EB] rounded-full mb-4">
          <svg
            className="animate-spin h-8 w-8 text-[#FF4D00]"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-[#1A1A1A] mb-2">
          {step === "payment" ? "Preparing Payment..." : "Processing Payment..."}
        </h3>
        <p className="text-[#6B6B6B] text-sm">
          {step === "payment"
            ? "Setting up your secure payment. Please wait..."
            : "Completing your payment. Do not close this window."}
        </p>
        {bookingId && (
          <p className="text-xs text-[#999] mt-4">
            Booking ID: {bookingId}
          </p>
        )}
      </div>
    );
  }

  const hasDiscounts = (weeklyDiscountPct ?? 0) > 0 || (monthlyDiscountPct ?? 0) > 0;

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Date Pickers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="start-date" className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
            Pick-up Date
          </label>
          <input
            id="start-date"
            type="date"
            value={startDate}
            min={today}
            onChange={(e) => {
              setStartDate(e.target.value);
              if (e.target.value >= endDate) {
                const next = new Date(e.target.value);
                next.setDate(next.getDate() + 1);
                setEndDate(next.toISOString().split("T")[0]!);
              }
            }}
            disabled={loading}
            className="w-full px-4 py-2.5 border border-[#E8E6E1] rounded-lg text-[#1A1A1A] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4D00] focus:border-[#FF4D00] bg-white disabled:opacity-50"
          />
        </div>
        <div>
          <label htmlFor="end-date" className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
            Drop-off Date
          </label>
          <input
            id="end-date"
            type="date"
            value={endDate}
            min={startDate || today}
            onChange={(e) => setEndDate(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-2.5 border border-[#E8E6E1] rounded-lg text-[#1A1A1A] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4D00] focus:border-[#FF4D00] bg-white disabled:opacity-50"
          />
        </div>
      </div>

      {/* Discount hints */}
      {hasDiscounts && (
        <div className="flex flex-wrap gap-2">
          {(weeklyDiscountPct ?? 0) > 0 && (
            <span className="text-xs text-[#FF4D00] bg-[#FFF1EB] border border-[#FF4D00]/20 px-2.5 py-1 rounded-full">
              {weeklyDiscountPct}% off for 7+ days
            </span>
          )}
          {(monthlyDiscountPct ?? 0) > 0 && (
            <span className="text-xs text-[#FF4D00] bg-[#FFF1EB] border border-[#FF4D00]/20 px-2.5 py-1 rounded-full">
              {monthlyDiscountPct}% off for 30+ days
            </span>
          )}
        </div>
      )}

      {/* Pickup Location */}
      <div>
        <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
          Pick-up & Drop-off Location
        </label>
        <div className="bg-[#FAFAF8] border border-[#E8E6E1] rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-[#FFF1EB] flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4.5 h-4.5 text-[#FF4D00]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-[#1A1A1A] text-sm">{vehicleAddress}</p>
              <p className="text-xs text-[#6B6B6B] mt-0.5">
                Car is parked here — pick up and return to this location
              </p>
            </div>
          </div>
        </div>

        {/* Delivery toggle */}
        <div className="mt-3">
          <button
            type="button"
            onClick={() => {
              setWantDelivery(!wantDelivery);
              if (wantDelivery) clearDelivery();
            }}
            disabled={loading}
            className="flex items-center gap-3 w-full text-left px-4 py-3 bg-white border border-[#E8E6E1] rounded-xl hover:border-[#FF4D00]/40 transition-colors cursor-pointer disabled:opacity-50"
          >
            <div
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                wantDelivery
                  ? "bg-[#FF4D00] border-[#FF4D00]"
                  : "border-[#E8E6E1]"
              }`}
            >
              {wantDelivery && (
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <span className="text-sm font-medium text-[#1A1A1A]">
                Deliver to my location
              </span>
              <span className="text-xs text-[#6B6B6B] ml-1">
                +{fmt(DELIVERY_FEE_PAISE / 100)} · within {MAX_DELIVERY_KM} km
              </span>
            </div>
            <svg className="w-4 h-4 text-[#999]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
          </button>
        </div>

        {/* Delivery address picker */}
        {wantDelivery && (
          <div className="mt-3 space-y-2">
            <PlacesAutocomplete
              placeholder="Enter your delivery address..."
              value={deliveryAddress ?? ""}
              onPlaceSelect={handleDeliveryPlaceSelect}
              onClear={clearDelivery}
              disabled={loading}
            />
            {deliveryError && (
              <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {deliveryError}
              </div>
            )}
            {deliveryFeeApplied && deliveryDistance !== null && (
              <div className="flex items-start gap-2 text-xs text-[#16A34A] bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>
                  {deliveryDistance.toFixed(1)} km from car — delivery fee: {fmt(DELIVERY_FEE_PAISE / 100)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Protection Plans */}
      <ProtectionPlans
        selected={protectionPlan}
        onChange={setProtectionPlan}
        formatPrice={fmt}
        subtotal={breakdown?.subtotal ?? baseDailyRate}
        disabled={loading}
      />

      {/* Promo Code */}
      {breakdown && (
        <div>
          {appliedPromo ? (
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-green-700">{appliedPromo.code} applied</p>
                  <p className="text-xs text-green-600">{appliedPromo.description} — saving {appliedPromo.discountFormatted}</p>
                </div>
              </div>
              <button
                onClick={removePromo}
                className="text-xs text-green-700 hover:text-green-900 font-medium transition-colors cursor-pointer"
              >
                Remove
              </button>
            </div>
          ) : (
            <div>
              <p className="text-xs text-[#6B6B6B] mb-2 font-medium">Have a promo code?</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoInput}
                  onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoError(null); }}
                  onKeyDown={(e) => { if (e.key === "Enter") applyPromo(); }}
                  placeholder="Enter code (e.g. VROOM10)"
                  disabled={loading || promoLoading}
                  className="flex-1 px-3.5 py-2.5 border border-[#E8E6E1] rounded-xl text-sm text-[#1A1A1A] placeholder:text-[#BBB] tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-[#FF4D00]/20 focus:border-[#FF4D00] transition-all disabled:opacity-50 uppercase"
                />
                <button
                  onClick={applyPromo}
                  disabled={!promoInput.trim() || loading || promoLoading}
                  className="px-4 py-2.5 bg-[#1A1A1A] hover:bg-[#333] disabled:bg-[#E8E6E1] disabled:text-[#999] text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  {promoLoading ? (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                      <path d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" fill="currentColor" />
                    </svg>
                  ) : "Apply"}
                </button>
              </div>
              {promoError && (
                <p className="text-xs text-red-600 mt-1.5">{promoError}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Price Breakdown */}
      {estimateLoading ? (
        <div className="bg-[#FAFAF8] rounded-lg p-5 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-[#6B6B6B]">
            <svg className="animate-spin h-4 w-4 text-[#FF4D00]" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
              <path d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" fill="currentColor" />
            </svg>
            Calculating price...
          </div>
        </div>
      ) : breakdown ? (
        <div>
          <PriceBreakdown
            days={breakdown.days}
            weekdays={breakdown.weekdays}
            weekendDays={breakdown.weekendDays}
            weekdayTotal={breakdown.weekdayTotal}
            weekendTotal={breakdown.weekendTotal}
            weeklyDiscount={breakdown.weeklyDiscount}
            monthlyDiscount={breakdown.monthlyDiscount}
            protectionFee={breakdown.protectionFee}
            protectionPlan={breakdown.protectionPlan}
            platformFee={breakdown.platformFee}
            tax={breakdown.tax}
            total={breakdown.total}
            formattedDailyRate={formattedDailyRate}
            weekendRate={formattedWeekendRate}
            format={fmt}
          />
          {deliveryFeeApplied && (
            <div className="flex items-center justify-between text-sm px-1 mt-2">
              <span className="text-[#6B6B6B]">Delivery fee</span>
              <span className="font-medium text-[#1A1A1A]">{fmt(DELIVERY_FEE_PAISE / 100)}</span>
            </div>
          )}
          {appliedPromo && (
            <div className="flex items-center justify-between text-sm px-1 mt-2">
              <span className="text-green-600">Promo ({appliedPromo.code})</span>
              <span className="font-medium text-green-600">−{appliedPromo.discountFormatted}</span>
            </div>
          )}
          {(deliveryFeeApplied || appliedPromo) && grandTotal !== null && (
            <div className="flex items-center justify-between text-sm font-bold px-1 mt-2 pt-2 border-t border-[#E8E6E1]">
              <span className="text-[#1A1A1A]">Total payable</span>
              <span className="text-[#FF4D00]">{fmt(grandTotal / 100)}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-[#FAFAF8] rounded-lg p-5 text-center text-sm text-[#6B6B6B]">
          Select valid dates to see the price breakdown
        </div>
      )}

      {/* Confirm & Pay Button */}
      <button
        onClick={handleConfirmBooking}
        disabled={!breakdown || loading || estimateLoading || (wantDelivery && !!deliveryError)}
        className="w-full px-6 py-3 bg-[#FF4D00] hover:bg-[#E64500] disabled:bg-[#E8E6E1] disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors cursor-pointer"
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Processing...
          </span>
        ) : (
          <>Book & Pay{grandTotal !== null ? ` — ${fmt(grandTotal / 100)}` : breakdown ? ` — ${fmt(breakdown.total / 100)}` : ""}</>
        )}
      </button>

      <div className="flex items-center justify-center gap-4 text-xs text-[#999]">
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Secure payment via Razorpay
        </span>
        <span>Free cancellation &gt;48hrs</span>
      </div>
    </div>
  );
}
