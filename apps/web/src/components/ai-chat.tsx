"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { ChatVehicleCard } from "./chat-vehicle-card";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ToolInvocation {
  toolName: string;
  state: string;
  result?: unknown;
}

interface MessagePart {
  type: string;
  text?: string;
  toolInvocation?: ToolInvocation;
}

interface ChatMessage {
  id: string;
  role: string;
  parts?: MessagePart[];
  createdAt?: Date | string;
}

interface AiChatProps {
  userRole?: string;
  hasActiveBooking?: boolean;
  hasActiveTrip?: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = "vroom-chat-history";
const MAX_STORED_MESSAGES = 50;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getRelativeTime(date: Date | string | undefined): string {
  if (!date) return "";
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 10) return "just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function getQuickActions(props: AiChatProps): string[] {
  const { userRole, hasActiveBooking, hasActiveTrip } = props;

  if (hasActiveTrip) {
    const base = ["My current trip status"];
    if (userRole === "host") {
      return [...base, "Show my vehicles", "Pending booking requests", "My earnings summary"];
    }
    return [...base, "What are my bookings?", "Find a car for this weekend", "Cancel a booking"];
  }

  if (userRole === "host") {
    return ["Show my vehicles", "Pending booking requests", "My earnings summary", "List a new car"];
  }

  if (userRole === "renter" || hasActiveBooking) {
    return ["What are my bookings?", "Find a car for this weekend", "Check my trip status", "Cancel a booking"];
  }

  return ["Find SUVs in Bangalore", "Compare sedan prices", "Show pickup points", "How does Vroom work?"];
}

function getToolLoadingText(toolName: string): { text: string; icon: string } {
  switch (toolName) {
    case "searchVehicles":
      return { text: "Searching for vehicles...", icon: "car" };
    case "getVehicleDetails":
      return { text: "Getting vehicle details...", icon: "car" };
    case "getMyBookings":
      return { text: "Fetching your bookings...", icon: "booking" };
    case "comparePricing":
      return { text: "Comparing prices...", icon: "price" };
    case "getPriceEstimate":
      return { text: "Calculating price...", icon: "price" };
    case "findPickupPoints":
      return { text: "Finding pickup points...", icon: "location" };
    case "getTripStatus":
      return { text: "Checking trip status...", icon: "trip" };
    case "getMyVehicles":
      return { text: "Loading your vehicles...", icon: "car" };
    case "getHostBookingRequests":
      return { text: "Fetching booking requests...", icon: "booking" };
    case "getHostEarnings":
      return { text: "Calculating earnings...", icon: "price" };
    case "createBooking":
      return { text: "Creating your booking...", icon: "booking" };
    case "cancelBooking":
      return { text: "Processing cancellation...", icon: "cancel" };
    case "checkAvailability":
      return { text: "Checking availability...", icon: "check" };
    case "getDeliveryEstimate":
      return { text: "Calculating delivery...", icon: "delivery" };
    case "getSmartRecommendations":
      return { text: "Finding perfect matches...", icon: "sparkle" };
    default:
      return { text: "Working on it...", icon: "default" };
  }
}

function ToolIcon({ icon, className }: { icon: string; className?: string }) {
  const base = className ?? "w-3.5 h-3.5";
  switch (icon) {
    case "car":
      return (
        <svg className={base} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 17h.01M16 17h.01M3 11l1.5-5A2 2 0 016.4 4h11.2a2 2 0 011.9 1.4L21 11M3 11v6a1 1 0 001 1h1a1 1 0 001-1v-1h12v1a1 1 0 001 1h1a1 1 0 001-1v-6M3 11h18" />
        </svg>
      );
    case "booking":
      return (
        <svg className={base} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      );
    case "price":
      return (
        <svg className={base} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      );
    case "location":
      return (
        <svg className={base} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0Z" />
        </svg>
      );
    case "trip":
      return (
        <svg className={base} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      );
    case "cancel":
      return (
        <svg className={base} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      );
    case "check":
      return (
        <svg className={base} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case "delivery":
      return (
        <svg className={base} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
        </svg>
      );
    case "sparkle":
      return (
        <svg className={base} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
        </svg>
      );
    default:
      return (
        <svg className={base} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
}

// ---------------------------------------------------------------------------
// Tool result cards
// ---------------------------------------------------------------------------

function BookingConfirmationCard({ data }: { data: Record<string, unknown> }) {
  const vehicleName = (data.vehicle ?? data.vehicleName ?? "") as string;
  const startDate = data.startDate ? String(data.startDate) : "";
  const endDate = data.endDate ? String(data.endDate) : "";
  const totalAmount = (data.totalPrice ?? data.totalAmount ?? "") as string;
  const bookingId = data.bookingId ? String(data.bookingId) : "";
  const confirmationLink = data.confirmationLink ? String(data.confirmationLink) : "";

  return (
    <div className="bg-white border border-emerald-200 rounded-xl p-4 text-xs">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center">
          <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-emerald-700 text-[13px]">Booking Confirmed!</p>
          {vehicleName && (
            <p className="text-[#6B6B6B] text-[11px]">{vehicleName}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5 mb-3">
        {startDate && endDate && (
          <div className="flex justify-between text-[#6B6B6B]">
            <span>Dates</span>
            <span className="font-medium text-[#0D0D0D]">{startDate} - {endDate}</span>
          </div>
        )}
        {totalAmount && (
          <div className="flex justify-between text-[#6B6B6B]">
            <span>Total</span>
            <span className="font-semibold text-[#0D0D0D]">{totalAmount}</span>
          </div>
        )}
      </div>

      {bookingId && (
        <p className="text-[10px] font-mono text-[#999] mb-3">ID: {bookingId}</p>
      )}

      {confirmationLink && (
        <Link
          href={confirmationLink}
          className="flex items-center justify-center gap-2 w-full text-[13px] font-semibold text-white bg-[#FF4D00] hover:bg-[#E64500] rounded-lg py-2.5 transition-colors"
        >
          Complete Payment
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      )}
    </div>
  );
}

function CancellationCard({ data }: { data: Record<string, unknown> }) {
  const status = data.status ? String(data.status) : "";
  const tier = data.cancellationTier ? String(data.cancellationTier) : "";
  const refund = data.refundAmount ? String(data.refundAmount) : "";
  const penalty = data.penaltyAmount ? String(data.penaltyAmount) : "";

  return (
    <div className="bg-white border border-red-200 rounded-xl p-4 text-xs">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center">
          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <p className="font-semibold text-red-600 text-[13px]">Booking Cancelled</p>
      </div>

      <div className="space-y-1.5 mb-2">
        {status && (
          <div className="flex justify-between text-[#6B6B6B]">
            <span>Status</span>
            <span className="font-medium text-[#0D0D0D] capitalize">{status}</span>
          </div>
        )}
        {tier && (
          <div className="flex justify-between text-[#6B6B6B]">
            <span>Cancellation tier</span>
            <span className="font-medium text-[#0D0D0D] capitalize">{tier}</span>
          </div>
        )}
        {refund && (
          <div className="flex justify-between text-[#6B6B6B]">
            <span>Refund amount</span>
            <span className="font-semibold text-emerald-600">{refund}</span>
          </div>
        )}
        {penalty && (
          <div className="flex justify-between text-[#6B6B6B]">
            <span>Penalty</span>
            <span className="font-medium text-red-500">{penalty}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function AvailabilityCard({ data }: { data: Record<string, unknown> }) {
  const available = Boolean(data.available);
  const vehicleName = (data.vehicle ?? data.vehicleName ?? "") as string;
  const conflicts = data.conflictingDates as Array<{ from: string; to: string }> | undefined;
  const conflictText = conflicts?.map((c) => `${c.from} – ${c.to}`).join(", ") ?? "";
  const suggestion = (data.suggestedAlternativeStart ?? data.message ?? "") as string;
  const bookLink = data.bookLink ? String(data.bookLink) : "";

  return (
    <div className={`bg-white border rounded-xl p-4 text-xs ${available ? "border-emerald-200" : "border-red-200"}`}>
      <div className="flex items-center gap-2 mb-2">
        {available ? (
          <>
            <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <p className="font-semibold text-emerald-700 text-[13px]">Available!</p>
          </>
        ) : (
          <>
            <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="font-semibold text-red-600 text-[13px]">Not Available</p>
          </>
        )}
      </div>

      {vehicleName && (
        <p className="text-[#6B6B6B] text-[11px] mb-2">{vehicleName}</p>
      )}

      {!available && conflictText && (
        <p className="text-[11px] text-red-500 mb-2">
          Booked: {conflictText}
        </p>
      )}

      {!available && suggestion && (
        <p className="text-[11px] text-[#6B6B6B] italic mb-2">Try from: {suggestion}</p>
      )}

      {available && bookLink && (
        <Link
          href={bookLink}
          className="flex items-center justify-center gap-1.5 w-full text-[12px] font-semibold text-white bg-[#FF4D00] hover:bg-[#E64500] rounded-lg py-2 transition-colors mt-2"
        >
          Book Now
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      )}
    </div>
  );
}

function DeliveryEstimateCard({ data }: { data: Record<string, unknown> }) {
  const eligible = Boolean(data.available ?? data.eligible);
  const distance = data.distance ? String(data.distance) : "";
  const deliveryFee = data.deliveryFee ? String(data.deliveryFee) : "";

  return (
    <div className={`bg-white border rounded-xl p-4 text-xs ${eligible ? "border-emerald-200" : "border-[#FF4D00]/30"}`}>
      <div className="flex items-center gap-2 mb-2">
        <ToolIcon icon="delivery" className="w-4 h-4 text-[#6B6B6B]" />
        <p className="font-semibold text-[#0D0D0D] text-[13px]">Delivery Estimate</p>
      </div>

      {distance && (
        <div className="flex justify-between text-[#6B6B6B] mb-1.5">
          <span>Distance</span>
          <span className="font-medium text-[#0D0D0D]">{distance}</span>
        </div>
      )}

      {eligible ? (
        <div className="flex items-center gap-2 mt-2 bg-emerald-50 rounded-lg px-3 py-2">
          <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          <div>
            <span className="font-semibold text-emerald-700 text-[12px]">Delivery available</span>
            {deliveryFee && (
              <span className="text-emerald-600 text-[11px] ml-1.5">({deliveryFee})</span>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 mt-2 bg-[#FFF1EB] rounded-lg px-3 py-2">
          <svg className="w-4 h-4 text-[#FF4D00] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <div>
            <span className="font-semibold text-[#FF4D00] text-[12px]">Too far for delivery</span>
            {distance && (
              <span className="text-[#6B6B6B] text-[11px] ml-1.5">({distance})</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function BookingListCard({ data }: { data: Record<string, unknown> }) {
  const bookings = (data.bookings ?? []) as Array<Record<string, unknown>>;

  const statusStyle: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-[#FFF1EB] text-[#FF4D00]",
    active: "bg-blue-100 text-blue-700",
    completed: "bg-[#F0EFEC] text-[#6B6B6B]",
    cancelled: "bg-red-100 text-red-600",
  };

  if (bookings.length === 0) {
    return (
      <div className="bg-white border border-[#E8E6E1] rounded-xl p-4 text-xs text-center text-[#6B6B6B]">
        No bookings found.
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E8E6E1] rounded-xl overflow-hidden text-xs">
      <div className="px-3 py-2 bg-[#FAFAF8] border-b border-[#E8E6E1] flex items-center gap-2">
        <ToolIcon icon="booking" className="w-3.5 h-3.5 text-[#6B6B6B]" />
        <span className="font-semibold text-[#0D0D0D] text-[12px]">Your Bookings ({bookings.length})</span>
      </div>
      <div className="divide-y divide-[#F0EFEC]">
        {bookings.slice(0, 5).map((b, i) => {
          const bStatus = b.status ? String(b.status) : "pending";
          const bLink = b.link ? String(b.link) : `/bookings/${String(b.id ?? "")}`;
          const bVehicle = (b.vehicleName ?? b.vehicleId ?? "Booking") as string;
          const bStart = b.startDate ? new Date(String(b.startDate)).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "";
          const bEnd = b.endDate ? new Date(String(b.endDate)).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "";
          const bAmount = b.totalAmount ? String(b.totalAmount) : "";
          return (
            <Link
              key={i}
              href={bLink}
              className="flex items-center justify-between px-3 py-2.5 hover:bg-[#FAFAF8] transition-colors"
            >
              <div className="min-w-0">
                <p className="font-medium text-[#0D0D0D] truncate text-[12px]">
                  {bVehicle}
                </p>
                <p className="text-[10px] text-[#6B6B6B] mt-0.5">
                  {bStart} - {bEnd}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                {bAmount && (
                  <span className="text-[11px] font-semibold text-[#0D0D0D]">{bAmount}</span>
                )}
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${statusStyle[bStatus] ?? statusStyle.pending}`}>
                  {bStatus}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
      {bookings.length > 5 && (
        <p className="text-center text-[10px] text-[#999] py-2 border-t border-[#F0EFEC]">
          +{bookings.length - 5} more bookings
        </p>
      )}
    </div>
  );
}

function PriceComparisonCard({ data }: { data: Record<string, unknown> }) {
  const vehicles = (data.vehicles ?? []) as Array<Record<string, unknown>>;
  const stats = {
    cheapest: data.cheapest as string | undefined,
    average: data.average as string | undefined,
    mostExpensive: data.mostExpensive as string | undefined,
  };

  const prices = vehicles.map((v) => {
    const raw = v.price ? String(v.price).replace(/[^\d.]/g, "") : "0";
    return Number(raw) || 0;
  });
  const maxPrice = Math.max(...prices, 1);

  return (
    <div className="bg-white border border-[#E8E6E1] rounded-xl p-3 text-xs">
      <div className="flex items-center gap-2 mb-3">
        <ToolIcon icon="price" className="w-3.5 h-3.5 text-[#6B6B6B]" />
        <span className="font-semibold text-[#0D0D0D] text-[12px]">Price Comparison</span>
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          {stats.cheapest ? (
            <div className="text-center bg-emerald-50 rounded-lg px-2 py-1.5">
              <p className="text-[10px] text-emerald-600 font-medium">Cheapest</p>
              <p className="text-[12px] font-bold text-emerald-700">{String(stats.cheapest)}</p>
            </div>
          ) : null}
          {stats.average ? (
            <div className="text-center bg-[#FAFAF8] rounded-lg px-2 py-1.5">
              <p className="text-[10px] text-[#6B6B6B] font-medium">Average</p>
              <p className="text-[12px] font-bold text-[#0D0D0D]">{String(stats.average)}</p>
            </div>
          ) : null}
          {stats.mostExpensive ? (
            <div className="text-center bg-[#FFF1EB] rounded-lg px-2 py-1.5">
              <p className="text-[10px] text-[#FF4D00] font-medium">Highest</p>
              <p className="text-[12px] font-bold text-[#E64500]">{String(stats.mostExpensive)}</p>
            </div>
          ) : null}
        </div>
      )}

      <div className="space-y-2">
        {vehicles.slice(0, 6).map((v, i) => {
          const price = prices[i] ?? 0;
          const pct = maxPrice > 0 ? Math.round((price / maxPrice) * 100) : 0;
          const vName = (v.name ?? `${v.make ?? ""} ${v.model ?? ""}`.trim()) as string;
          const vFormatted = (v.price ?? v.priceFormatted ?? `${price}/day`) as string;
          return (
            <div key={i}>
              <div className="flex justify-between mb-0.5">
                <span className="text-[11px] text-[#0D0D0D] font-medium truncate mr-2">
                  {vName}
                </span>
                <span className="text-[11px] text-[#FF4D00] font-semibold whitespace-nowrap">
                  {vFormatted}
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#F0EFEC] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#FF4D00] to-[#E64500] rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Existing cards (preserved & enhanced)
// ---------------------------------------------------------------------------

function PriceBreakdownCard({ data }: { data: Record<string, unknown> }) {
  if (data.error) {
    return null;
  }

  const rows: Array<{ label: string; value: string; bold?: boolean }> = [];
  rows.push({ label: `${data.days} days × ${data.baseRate}`, value: "" });
  if (data.weekdayTotal) rows.push({ label: `  Weekdays (${data.weekdays})`, value: data.weekdayTotal as string });
  if (data.weekendTotal && (data.weekendDays as number) > 0) rows.push({ label: `  Weekends (${data.weekendDays})`, value: data.weekendTotal as string });
  if (data.weeklyDiscount) rows.push({ label: "  Weekly discount", value: `-${data.weeklyDiscount}` });
  if (data.monthlyDiscount) rows.push({ label: "  Monthly discount", value: `-${data.monthlyDiscount}` });
  rows.push({ label: `Protection (${data.protectionPlan})`, value: data.protectionFee as string });
  rows.push({ label: "Platform fee", value: data.platformFee as string });
  rows.push({ label: "Tax (GST)", value: data.tax as string });
  rows.push({ label: "Total", value: data.total as string, bold: true });

  return (
    <div className="bg-white border border-[#E8E6E1] rounded-xl p-3 text-[11px]">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-[#1A1A1A] text-xs">
          {data.vehicle as string}
        </span>
        <span className="text-[#FF4D00] text-[10px] font-medium">
          {data.perDayEffective as string}/day eff.
        </span>
      </div>
      <div className="space-y-1">
        {rows.map((r, i) => (
          <div
            key={i}
            className={`flex justify-between ${r.bold ? "border-t border-[#E8E6E1] pt-1.5 mt-1.5 font-semibold text-[#1A1A1A] text-xs" : "text-[#6B6B6B]"}`}
          >
            <span>{r.label}</span>
            {r.value && <span>{r.value}</span>}
          </div>
        ))}
      </div>
      {typeof data.bookLink === "string" && (
        <Link
          href={data.bookLink}
          className="block text-center mt-2.5 text-[11px] font-medium text-white bg-[#FF4D00] hover:bg-[#E64500] rounded-lg py-1.5 transition-colors"
        >
          Book Now
        </Link>
      )}
    </div>
  );
}

function PickupPointsCard({ data }: { data: Record<string, unknown> }) {
  if (data.message) {
    return null;
  }

  const points = (data.pickupPoints ?? []) as Array<{
    name: string;
    landmark: string | null;
  }>;

  return (
    <div className="bg-white border border-[#E8E6E1] rounded-xl p-3 text-[11px]">
      <p className="font-semibold text-[#1A1A1A] text-xs mb-2">
        Pickup Points in {data.city as string} ({data.count as number})
      </p>
      <div className="space-y-1.5">
        {points.slice(0, 6).map((p, i) => (
          <div key={i} className="flex items-start gap-2">
            <svg
              className="w-3.5 h-3.5 text-[#FF4D00] flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
              />
            </svg>
            <div>
              <span className="font-medium text-[#1A1A1A]">{p.name}</span>
              {p.landmark && (
                <span className="text-[#999] ml-1">· {p.landmark}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Markdown rendering (preserved)
// ---------------------------------------------------------------------------

function MessageContent({ content }: { content: string }) {
  const lines = content.split("\n");

  return (
    <div className="whitespace-pre-wrap space-y-1">
      {lines.map((line, i) => {
        if (line.startsWith("### ")) {
          return (
            <p key={i} className="font-semibold text-[#1A1A1A] text-[13px] mt-1">
              {renderInline(line.slice(4))}
            </p>
          );
        }
        if (line.startsWith("## ")) {
          return (
            <p key={i} className="font-semibold text-[#1A1A1A] text-sm mt-1">
              {renderInline(line.slice(3))}
            </p>
          );
        }
        if (/^[-*] /.test(line)) {
          return (
            <div key={i} className="flex gap-1.5 ml-1">
              <span className="text-[#FF4D00] flex-shrink-0">·</span>
              <span>{renderInline(line.slice(2))}</span>
            </div>
          );
        }
        if (/^\d+\. /.test(line)) {
          const num = line.match(/^(\d+)\. /)?.[1];
          return (
            <div key={i} className="flex gap-1.5 ml-1">
              <span className="text-[#FF4D00] flex-shrink-0 font-medium text-[11px] min-w-[14px]">
                {num}.
              </span>
              <span>{renderInline(line.replace(/^\d+\. /, ""))}</span>
            </div>
          );
        }
        if (line.trim() === "") {
          return <br key={i} />;
        }
        return <span key={i}>{renderInline(line)}</span>;
      })}
    </div>
  );
}

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\[.+?\]\(.+?\)|\*\*.+?\*\*|`[^`]+`)/g);

  return parts.map((part, i) => {
    const linkMatch = part.match(/^\[(.+?)\]\((.+?)\)$/);
    if (linkMatch) {
      return (
        <Link
          key={i}
          href={linkMatch[2]!}
          className="text-[#FF4D00] underline hover:text-[#E64500] font-medium"
        >
          {linkMatch[1]}
        </Link>
      );
    }

    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="bg-[#E8E6E1] text-[#1A1A1A] px-1 py-0.5 rounded text-[11px] font-mono"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    return <span key={i}>{part}</span>;
  });
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function AiChat({ userRole, hasActiveBooking, hasActiveTrip }: AiChatProps = {}) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [input, setInput] = useState("");
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [hasSpeech, setHasSpeech] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [animatedIds, setAnimatedIds] = useState<Set<string>>(new Set());

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<ReturnType<typeof createRecognition> | null>(null);
  const isNearBottomRef = useRef(true);

  // ---- Chat transport (stable ref) ----
  const transportRef = useRef(new DefaultChatTransport({ api: "/api/chat" }));

  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport: transportRef.current,
  });

  const isLoading = status === "submitted" || status === "streaming";

  // ---- Quick actions ----
  const quickActions = useMemo(
    () => getQuickActions({ userRole, hasActiveBooking, hasActiveTrip }),
    [userRole, hasActiveBooking, hasActiveTrip],
  );

  // ---- Speech recognition setup ----
  useEffect(() => {
    try {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SR) setHasSpeech(true);
    } catch {
      // not supported
    }
  }, []);

  function createRecognition() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return null;
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-IN";
    return recognition;
  }

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const recognition = createRecognition();
      if (!recognition) return;

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript ?? "";
        if (transcript) {
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
        setIsRecording(false);
      };
      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);

      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
    } catch {
      setIsRecording(false);
    }
  }, [isRecording]);

  // ---- localStorage persistence ----
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ChatMessage[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed as any);
        }
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (messages.length === 0) return;
    try {
      const toStore = messages.slice(-MAX_STORED_MESSAGES);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch {
      // quota exceeded, etc.
    }
  }, [messages]);

  const clearHistory = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setMessages([]);
  }, [setMessages]);

  // ---- Scroll management ----
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, []);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    isNearBottomRef.current = nearBottom;
    setShowScrollBtn(!nearBottom);
  }, []);

  useEffect(() => {
    if (isNearBottomRef.current) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  // ---- Focus input on open ----
  useEffect(() => {
    if (open && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [open]);

  // ---- Escape closes chat ----
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  // ---- Auto-resize textarea ----
  const adjustTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const maxHeight = 4 * 24; // ~4 lines
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  }, []);

  useEffect(() => {
    adjustTextarea();
  }, [input, adjustTextarea]);

  // ---- Track animated message IDs for fade-in ----
  useEffect(() => {
    const newIds = messages
      .map((m) => m.id)
      .filter((id) => !animatedIds.has(id));
    if (newIds.length > 0) {
      setAnimatedIds((prev) => {
        const next = new Set(prev);
        newIds.forEach((id) => next.add(id));
        return next;
      });
    }
    // We only want to react to messages changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  // ---- Submit ----
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    sendMessage({ text });
  };

  const handleQuickQuestion = (q: string) => {
    setInput("");
    sendMessage({ text: q });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // ---- Sizing classes ----
  const chatSizeClasses = expanded
    ? "sm:w-[560px] sm:max-h-[700px]"
    : "sm:w-[400px] sm:max-h-[600px]";

  const messageSizeClasses = expanded
    ? "sm:min-h-[400px] sm:max-h-[520px]"
    : "sm:min-h-[300px] sm:max-h-[420px]";

  return (
    <>
      {/* Chat panel */}
      <div
        className={`fixed z-50 flex flex-col overflow-hidden bg-white shadow-2xl border border-[#E8E6E1] transition-all duration-300 ease-in-out ${
          open
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-4 pointer-events-none"
        } ${
          // Mobile: full screen; Desktop: floating widget
          "inset-0 sm:inset-auto sm:bottom-24 sm:right-6 sm:rounded-2xl"
        } ${chatSizeClasses}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0EFEC] bg-gradient-to-r from-[#FF4D00] to-[#E64500] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Vroom AI</h3>
              <p className="text-xs text-white/60">
                Your car rental assistant
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* Clear history */}
            {messages.length > 0 && (
              <button
                onClick={clearHistory}
                className="p-1.5 text-white/50 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                aria-label="Clear chat history"
                title="Clear history"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
            )}
            {/* Maximize / Minimize (desktop only) */}
            <button
              onClick={() => setExpanded(!expanded)}
              className="hidden sm:flex p-1.5 text-white/50 hover:text-white transition-colors rounded-lg hover:bg-white/10"
              aria-label={expanded ? "Minimize chat" : "Maximize chat"}
              title={expanded ? "Minimize" : "Maximize"}
            >
              {expanded ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                </svg>
              )}
            </button>
            {/* Close */}
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 text-white/50 hover:text-white transition-colors rounded-lg hover:bg-white/10"
              aria-label="Close chat"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          role="log"
          aria-live="polite"
          aria-label="Chat messages"
          className={`flex-1 overflow-y-auto px-5 py-4 space-y-4 ${messageSizeClasses}`}
        >
          {messages.length === 0 && (
            <div className="text-center py-8 animate-[fadeIn_0.3s_ease-out]">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#FFF1EB] flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-[#FF4D00]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-[#0D0D0D]">
                Hi! I&apos;m Vroom AI
              </p>
              <p className="text-xs text-[#6B6B6B] mt-1 max-w-[260px] mx-auto">
                I can help you find cars, compare prices, get cost estimates,
                check your bookings, and more.
              </p>
              <div className="mt-5 space-y-2">
                {quickActions.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleQuickQuestion(q)}
                    className="block w-full text-left text-xs text-[#FF4D00] bg-[#FFF1EB] hover:bg-[#FFE4D6] rounded-lg px-3 py-2 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => {
            const parts = (msg.parts ?? []) as MessagePart[];
            const textParts = parts.filter(
              (p): p is MessagePart & { text: string } =>
                p.type === "text" && !!p.text,
            );
            const toolParts = parts.filter(
              (p): p is MessagePart & { toolInvocation: ToolInvocation } =>
                p.type === "tool-invocation" && !!p.toolInvocation,
            );

            const text = textParts.map((p) => p.text).join("");

            // Existing tool results
            const vehicleResults = toolParts
              .filter(
                (p) =>
                  p.toolInvocation.toolName === "searchVehicles" &&
                  p.toolInvocation.state === "result",
              )
              .flatMap((p) => {
                const result = p.toolInvocation.result as { vehicles?: Array<Record<string, unknown>> } | null;
                return result?.vehicles ?? [];
              });

            const priceResults = toolParts
              .filter(
                (p) =>
                  p.toolInvocation.toolName === "getPriceEstimate" &&
                  p.toolInvocation.state === "result",
              )
              .map((p) => p.toolInvocation.result as Record<string, unknown> | null)
              .filter(Boolean);

            const pickupResults = toolParts
              .filter(
                (p) =>
                  p.toolInvocation.toolName === "findPickupPoints" &&
                  p.toolInvocation.state === "result",
              )
              .map((p) => p.toolInvocation.result as Record<string, unknown> | null)
              .filter(Boolean);

            // New tool results
            const bookingResults = toolParts
              .filter(
                (p) =>
                  p.toolInvocation.toolName === "createBooking" &&
                  p.toolInvocation.state === "result",
              )
              .map((p) => p.toolInvocation.result as Record<string, unknown> | null)
              .filter(Boolean);

            const cancellationResults = toolParts
              .filter(
                (p) =>
                  p.toolInvocation.toolName === "cancelBooking" &&
                  p.toolInvocation.state === "result",
              )
              .map((p) => p.toolInvocation.result as Record<string, unknown> | null)
              .filter(Boolean);

            const availabilityResults = toolParts
              .filter(
                (p) =>
                  p.toolInvocation.toolName === "checkAvailability" &&
                  p.toolInvocation.state === "result",
              )
              .map((p) => p.toolInvocation.result as Record<string, unknown> | null)
              .filter(Boolean);

            const recommendationResults = toolParts
              .filter(
                (p) =>
                  p.toolInvocation.toolName === "getSmartRecommendations" &&
                  p.toolInvocation.state === "result",
              )
              .flatMap((p) => {
                const result = p.toolInvocation.result as { vehicles?: Array<Record<string, unknown>> } | null;
                return result?.vehicles ?? [];
              });

            const deliveryResults = toolParts
              .filter(
                (p) =>
                  p.toolInvocation.toolName === "getDeliveryEstimate" &&
                  p.toolInvocation.state === "result",
              )
              .map((p) => p.toolInvocation.result as Record<string, unknown> | null)
              .filter(Boolean);

            const myBookingsResults = toolParts
              .filter(
                (p) =>
                  p.toolInvocation.toolName === "getMyBookings" &&
                  p.toolInvocation.state === "result",
              )
              .map((p) => p.toolInvocation.result as Record<string, unknown> | null)
              .filter(Boolean);

            const compareResults = toolParts
              .filter(
                (p) =>
                  p.toolInvocation.toolName === "comparePricing" &&
                  p.toolInvocation.state === "result",
              )
              .map((p) => p.toolInvocation.result as Record<string, unknown> | null)
              .filter(Boolean);

            const loadingTools = toolParts.filter(
              (p) => p.toolInvocation.state === "call",
            );

            const hasAnyResult =
              text ||
              vehicleResults.length > 0 ||
              priceResults.length > 0 ||
              pickupResults.length > 0 ||
              bookingResults.length > 0 ||
              cancellationResults.length > 0 ||
              availabilityResults.length > 0 ||
              recommendationResults.length > 0 ||
              deliveryResults.length > 0 ||
              myBookingsResults.length > 0 ||
              compareResults.length > 0 ||
              loadingTools.length > 0;

            if (!hasAnyResult) return null;

            const timestamp = getRelativeTime((msg as unknown as ChatMessage).createdAt);
            const isNew = animatedIds.has(msg.id);

            if (msg.role === "user") {
              return (
                <div
                  key={msg.id}
                  className={`flex justify-end gap-2 ${isNew ? "animate-[fadeSlideUp_0.3s_ease-out]" : ""}`}
                >
                  <div className="flex flex-col items-end">
                    <div className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed bg-[#FF4D00] text-white rounded-br-md">
                      <span>{text}</span>
                    </div>
                    {timestamp && (
                      <span className="text-[10px] text-[#999] mt-1 mr-1">{timestamp}</span>
                    )}
                  </div>
                  <div className="w-6 h-6 rounded-full bg-[#FF4D00] flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-[10px] font-bold text-white">U</span>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex justify-start gap-2 ${isNew ? "animate-[fadeSlideUp_0.3s_ease-out]" : ""}`}
              >
                <div className="w-6 h-6 rounded-full bg-[#FFF1EB] flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-3.5 h-3.5 text-[#FF4D00]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
                <div className="max-w-[90%] space-y-2 min-w-0">
                  {/* Tool loading states */}
                  {loadingTools.length > 0 && !text && vehicleResults.length === 0 && (
                    <div className="bg-[#FAFAF8] rounded-xl px-3 py-2 text-[11px] text-[#6B6B6B] flex items-center gap-2">
                      <div className="w-4 h-4 flex items-center justify-center relative">
                        <div className="absolute inset-0 border-2 border-[#FF4D00] border-t-transparent rounded-full animate-spin" />
                        <ToolIcon
                          icon={getToolLoadingText(loadingTools[0]!.toolInvocation.toolName).icon}
                          className="w-2.5 h-2.5 text-[#FF4D00]"
                        />
                      </div>
                      {getToolLoadingText(loadingTools[0]!.toolInvocation.toolName).text}
                    </div>
                  )}

                  {/* Text content */}
                  {text && (
                    <div className="bg-[#F0EFEC] text-[#0D0D0D] rounded-2xl rounded-bl-md px-4 py-2.5 text-sm leading-relaxed">
                      <MessageContent content={text} />
                    </div>
                  )}

                  {/* Vehicle search results */}
                  {vehicleResults.length > 0 && (
                    <div className="space-y-1.5">
                      {vehicleResults.slice(0, 4).map((v: Record<string, unknown>) => (
                        <ChatVehicleCard
                          key={v.id as string}
                          vehicle={{
                            id: v.id as string,
                            make: v.make as string,
                            model: v.model as string,
                            year: v.year as number,
                            vehicleType: v.vehicleType as string,
                            transmission: v.transmission as string,
                            fuelType: v.fuelType as string,
                            seats: v.seats as number,
                            pricePerDay: v.pricePerDay as string,
                            city: v.city as string,
                            rating: v.rating as string | null,
                            reviewCount: v.reviewCount as number | undefined,
                            photo: v.photo as string | null,
                            link: v.link as string,
                            bookLink: v.bookLink as string,
                          }}
                        />
                      ))}
                      {vehicleResults.length > 4 && (
                        <p className="text-[11px] text-[#999] text-center pt-1">
                          +{vehicleResults.length - 4} more results
                        </p>
                      )}
                    </div>
                  )}

                  {/* Smart recommendation results (reuse ChatVehicleCard) */}
                  {recommendationResults.length > 0 && (
                    <div className="space-y-1.5">
                      {recommendationResults.slice(0, 5).map((v: Record<string, unknown>) => (
                        <ChatVehicleCard
                          key={v.id as string}
                          vehicle={{
                            id: v.id as string,
                            make: v.make as string,
                            model: v.model as string,
                            year: v.year as number,
                            vehicleType: v.vehicleType as string,
                            transmission: v.transmission as string,
                            fuelType: v.fuelType as string,
                            seats: v.seats as number,
                            pricePerDay: v.pricePerDay as string,
                            city: v.city as string,
                            rating: v.rating as string | null,
                            reviewCount: v.reviewCount as number | undefined,
                            photo: v.photo as string | null,
                            link: v.link as string,
                            bookLink: v.bookLink as string,
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Price estimate results */}
                  {priceResults.map((pr, i) => (
                    <PriceBreakdownCard key={`price-${i}`} data={pr!} />
                  ))}

                  {/* Pickup point results */}
                  {pickupResults.map((pp, i) => (
                    <PickupPointsCard key={`pickup-${i}`} data={pp!} />
                  ))}

                  {/* Booking confirmation results */}
                  {bookingResults.map((br, i) => (
                    <BookingConfirmationCard key={`booking-${i}`} data={br!} />
                  ))}

                  {/* Cancellation results */}
                  {cancellationResults.map((cr, i) => (
                    <CancellationCard key={`cancel-${i}`} data={cr!} />
                  ))}

                  {/* Availability results */}
                  {availabilityResults.map((ar, i) => (
                    <AvailabilityCard key={`avail-${i}`} data={ar!} />
                  ))}

                  {/* Delivery estimate results */}
                  {deliveryResults.map((dr, i) => (
                    <DeliveryEstimateCard key={`delivery-${i}`} data={dr!} />
                  ))}

                  {/* My bookings list */}
                  {myBookingsResults.map((mb, i) => (
                    <BookingListCard key={`mybookings-${i}`} data={mb!} />
                  ))}

                  {/* Price comparison results */}
                  {compareResults.map((cp, i) => (
                    <PriceComparisonCard key={`compare-${i}`} data={cp!} />
                  ))}

                  {/* Timestamp */}
                  {timestamp && (
                    <span className="text-[10px] text-[#999] ml-1">{timestamp}</span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {isLoading &&
            messages.length > 0 &&
            !(messages[messages.length - 1]?.parts ?? []).some(
              (p: MessagePart) =>
                p.type === "tool-invocation" &&
                p.toolInvocation?.state === "call",
            ) && (
              <div className="flex justify-start gap-2">
                <div className="w-6 h-6 rounded-full bg-[#FFF1EB] flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-3.5 h-3.5 text-[#FF4D00]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
                <div className="bg-[#F0EFEC] rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-1.5 h-1.5 bg-[#FF4D00] rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <div
                        className="w-1.5 h-1.5 bg-[#FF4D00] rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <div
                        className="w-1.5 h-1.5 bg-[#FF4D00] rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                    <span className="text-[11px] text-[#6B6B6B]">Vroom AI is typing...</span>
                  </div>
                </div>
              </div>
            )}

          {error && (
            <div className="text-center animate-[fadeSlideUp_0.3s_ease-out]">
              <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 inline-block">
                Something went wrong. Please try again.
              </p>
            </div>
          )}
        </div>

        {/* Jump to bottom button */}
        {showScrollBtn && (
          <div className="absolute bottom-[72px] left-1/2 -translate-x-1/2 z-10">
            <button
              onClick={scrollToBottom}
              className="flex items-center gap-1.5 bg-white border border-[#E8E6E1] rounded-full px-3 py-1.5 shadow-md text-[11px] text-[#6B6B6B] hover:text-[#0D0D0D] hover:border-[#FF4D00]/30 transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
              </svg>
              Jump to bottom
            </button>
          </div>
        )}

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="px-4 py-3 border-t border-[#F0EFEC] bg-white flex-shrink-0"
        >
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything about cars..."
                aria-label="Chat message"
                rows={1}
                className="w-full text-sm bg-[#FAFAF8] border border-[#E8E6E1] rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#FF4D00] focus:border-transparent placeholder:text-[#999] resize-none overflow-hidden leading-6"
                disabled={isLoading}
                style={{ maxHeight: `${4 * 24}px` }}
              />
              {input.length > 200 && (
                <span className="absolute bottom-1 right-2 text-[10px] text-[#999]">
                  {input.length}
                </span>
              )}
            </div>

            {/* Mic button */}
            {hasSpeech && (
              <button
                type="button"
                onClick={toggleRecording}
                aria-label={isRecording ? "Stop recording" : "Start voice input"}
                className={`p-2.5 rounded-xl transition-all flex-shrink-0 ${
                  isRecording
                    ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30"
                    : "bg-[#FAFAF8] border border-[#E8E6E1] text-[#6B6B6B] hover:text-[#FF4D00] hover:border-[#FF4D00]/30"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                </svg>
              </button>
            )}

            {/* Send button */}
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              aria-label="Send message"
              className="p-2.5 bg-[#FF4D00] hover:bg-[#E64500] disabled:bg-[#E8E6E1] text-white disabled:text-[#999] rounded-xl transition-colors flex-shrink-0"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </div>
        </form>
      </div>

      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close chat assistant" : "Open chat assistant"}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#FF4D00] hover:bg-[#E64500] text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center group ${
          open ? "sm:opacity-100 opacity-0 pointer-events-none sm:pointer-events-auto" : ""
        }`}
      >
        {open ? (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        ) : (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        )}
      </button>

      {/* Global keyframe animations */}
      {/* eslint-disable-next-line react/no-unknown-property */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      ` }} />
    </>
  );
}
