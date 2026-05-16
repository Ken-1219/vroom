"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import Link from "next/link";
import { notify } from "@/lib/mutation-store";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MessagePart {
  type: string;
  text?: string;
  // AI SDK v6 DynamicToolUIPart fields (flat on the part)
  toolName?: string;
  toolCallId?: string;
  state?: string;
  input?: unknown;
  output?: unknown;
  // AI SDK v3 compat
  toolInvocation?: {
    toolName?: string;
    toolCallId?: string;
    state?: string;
    result?: unknown;
    args?: unknown;
  };
}

interface CommandBarContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const CommandBarContext = createContext<CommandBarContextValue | null>(null);

export function useCommandBar() {
  const ctx = useContext(CommandBarContext);
  if (!ctx) {
    throw new Error("useCommandBar must be used within a CommandBarProvider");
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function CommandBarProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <CommandBarContext.Provider value={{ open, setOpen }}>
      {children}
    </CommandBarContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------

const BRAND = "#FF4D00";
const BRAND_DARK = "#E64500";
const TEXT = "#0D0D0D";
const SURFACE = "#FAFAF8";
const BORDER = "#E8E6E1";
const ORANGE_LIGHT = "#FFF1EB";
const GRAY_LIGHT = "#F0EFEC";

// ---------------------------------------------------------------------------
// Suggestions
// ---------------------------------------------------------------------------

const SUGGESTIONS = [
  "Find SUVs in Bangalore",
  "Weekend car under ₹2000",
  "Compare prices",
  "My bookings",
  "Family trip recommendations",
];

// ---------------------------------------------------------------------------
// Tool loading text
// ---------------------------------------------------------------------------

function getToolLoadingText(toolName: string): { text: string; icon: string } {
  switch (toolName) {
    case "searchVehicles":
      return { text: "Searching vehicles...", icon: "car" };
    case "getVehicleInfo":
      return { text: "Getting details...", icon: "car" };
    case "manageBookings":
      return { text: "Managing booking...", icon: "booking" };
    default:
      return { text: "Working on it...", icon: "default" };
  }
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

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

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? "w-5 h-5"}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Tool result card components
// ---------------------------------------------------------------------------

function VehicleCard({ vehicle }: { vehicle: Record<string, unknown> }) {
  const photo = vehicle.photo as string | null;
  const make = vehicle.make as string;
  const model = vehicle.model as string;
  const year = vehicle.year as number;
  const transmission = vehicle.transmission as string;
  const fuelType = vehicle.fuelType as string;
  const seats = vehicle.seats as number;
  const pricePerDay = vehicle.pricePerDay as string;
  const location = (vehicle.location ?? vehicle.city ?? "") as string;
  const distanceKm = vehicle.distanceKm as number | undefined;
  const rating = vehicle.rating as string | null;
  const link = vehicle.link as string;
  const bookLink = vehicle.bookLink as string;

  return (
    <div className="flex gap-3 bg-white rounded-xl border border-[#E8E6E1] p-3 hover:border-[#FF4D00]/30 transition-colors group">
      {photo && (
        <div className="w-24 h-[72px] rounded-lg overflow-hidden flex-shrink-0 bg-[#F0EFEC]">
          <img
            src={photo}
            alt={`${make} ${model}`}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={link}
            className="text-sm font-semibold text-[#0D0D0D] hover:text-[#E64500] truncate"
          >
            {make} {model}
          </Link>
          <span className="text-sm font-bold text-[#FF4D00] whitespace-nowrap">
            {pricePerDay}
            <span className="text-xs text-[#999] font-normal">/day</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-1 text-xs text-[#6B6B6B]">
          <span>{year}</span>
          <span className="text-[#E8E6E1]">|</span>
          <span className="capitalize">{transmission}</span>
          <span className="text-[#E8E6E1]">|</span>
          <span className="capitalize">{fuelType}</span>
          <span className="text-[#E8E6E1]">|</span>
          <span>{seats} seats</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2 text-xs text-[#6B6B6B] min-w-0">
            <span className="truncate">{location}</span>
            {distanceKm != null && (
              <>
                <span className="text-[#E8E6E1] flex-shrink-0">|</span>
                <span className="flex-shrink-0">{distanceKm} km</span>
              </>
            )}
            {rating && (
              <>
                <span className="text-[#E8E6E1] flex-shrink-0">|</span>
                <span className="text-amber-600 font-medium flex-shrink-0">
                  ★ {rating}
                </span>
              </>
            )}
          </div>
          <Link
            href={bookLink}
            className="text-xs font-semibold text-[#FF4D00] hover:text-[#E64500] opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Book →
          </Link>
        </div>
      </div>
    </div>
  );
}

function BookingConfirmationCard({ data }: { data: Record<string, unknown> }) {
  const vehicleName = (data.vehicle ?? data.vehicleName ?? "") as string;
  const startDate = data.startDate ? String(data.startDate) : "";
  const endDate = data.endDate ? String(data.endDate) : "";
  const totalAmount = (data.total ?? data.totalPrice ?? data.totalAmount ?? "") as string;
  const bookingId = data.bookingId ? String(data.bookingId) : "";
  const paymentLink = (data.paymentLink ?? data.confirmationLink ?? "") as string;

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    } catch { return d; }
  };

  return (
    <div className="bg-white border border-[#FF4D00]/20 rounded-xl p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-full bg-[#FFF1EB] flex items-center justify-center">
          <svg className="w-4.5 h-4.5 text-[#FF4D00]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-[#FF4D00] text-sm">Booking Created</p>
          {vehicleName && (
            <p className="text-[#6B6B6B] text-xs">{vehicleName}</p>
          )}
        </div>
      </div>

      <div className="space-y-2 mb-4 text-sm">
        {startDate && endDate && (
          <div className="flex justify-between text-[#6B6B6B]">
            <span>Dates</span>
            <span className="font-medium text-[#0D0D0D]">{formatDate(startDate)} – {formatDate(endDate)}</span>
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
        <p className="text-xs font-mono text-[#999] mb-4">ID: {bookingId}</p>
      )}

      {paymentLink && (
        <Link
          href={paymentLink}
          className="flex items-center justify-center gap-2 w-full text-sm font-semibold text-white bg-[#FF4D00] hover:bg-[#E64500] rounded-xl py-3 transition-colors"
        >
          Pay Now
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      )}
    </div>
  );
}

function CancellationCard({ data }: { data: Record<string, unknown> }) {
  const message = data.message ? String(data.message) : "";
  const bookingId = data.bookingId ? String(data.bookingId) : "";
  const tier = data.cancellationTier ? String(data.cancellationTier) : "";
  const refund = data.refundAmount ? String(data.refundAmount) : "";

  return (
    <div className="bg-white border border-red-200 rounded-xl p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
          <svg className="w-4.5 h-4.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <p className="font-semibold text-red-600 text-sm">Booking Cancelled</p>
      </div>

      <div className="space-y-2 mb-2 text-sm">
        {bookingId && (
          <div className="flex justify-between text-[#6B6B6B]">
            <span>Booking ID</span>
            <span className="font-medium text-[#0D0D0D] font-mono text-xs">{bookingId}</span>
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
      </div>

      {message && (
        <p className="text-xs text-[#6B6B6B] mt-3 pt-3 border-t border-red-100">{message}</p>
      )}
    </div>
  );
}

function AvailabilityCard({ data }: { data: Record<string, unknown> }) {
  const available = Boolean(data.available);
  const vehicleName = (data.vehicle ?? data.vehicleName ?? "") as string;
  const message = data.message ? String(data.message) : "";
  const bookLink = data.bookLink ? String(data.bookLink) : "";
  const conflicts = data.conflictingDates as Array<{ from: string; to: string; status?: string }> | undefined;
  const suggestedStart = data.suggestedAlternativeStart ? String(data.suggestedAlternativeStart) : "";

  return (
    <div className={`bg-white border rounded-xl p-4 ${available ? "border-emerald-200" : "border-red-200"}`}>
      <div className="flex items-center gap-3 mb-3">
        {available ? (
          <>
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
              <svg className="w-4.5 h-4.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-emerald-700 text-sm">Available!</p>
              {vehicleName && <p className="text-xs text-[#6B6B6B]">{vehicleName}</p>}
            </div>
          </>
        ) : (
          <>
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-4.5 h-4.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-red-600 text-sm">Not Available</p>
              {vehicleName && <p className="text-xs text-[#6B6B6B]">{vehicleName}</p>}
            </div>
          </>
        )}
      </div>

      {message && (
        <p className="text-sm text-[#6B6B6B] mb-3">{message}</p>
      )}

      {!available && conflicts && conflicts.length > 0 && (
        <div className="mb-3 space-y-1">
          <p className="text-xs font-medium text-red-500 mb-1">Conflicting dates:</p>
          {conflicts.map((c, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-[#6B6B6B]">
              <span>{c.from} - {c.to}</span>
              {c.status && (
                <span className="text-[10px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded-full capitalize">{c.status}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {!available && suggestedStart && (
        <p className="text-xs text-[#6B6B6B] italic mb-3">
          Suggested alternative start: <span className="font-medium text-[#0D0D0D]">{suggestedStart}</span>
        </p>
      )}

      {available && bookLink && (
        <Link
          href={bookLink}
          className="flex items-center justify-center gap-2 w-full text-sm font-semibold text-white bg-[#FF4D00] hover:bg-[#E64500] rounded-xl py-2.5 transition-colors mt-2"
        >
          Book Now
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      )}
    </div>
  );
}

function DeliveryEstimateCard({ data }: { data: Record<string, unknown> }) {
  const eligible = Boolean(data.available);
  const vehicleName = (data.vehicle ?? "") as string;
  const distance = data.distance ? String(data.distance) : "";
  const deliveryFee = data.deliveryFee ? String(data.deliveryFee) : "";
  const message = data.message ? String(data.message) : "";

  return (
    <div className={`bg-white border rounded-xl p-4 ${eligible ? "border-emerald-200" : "border-[#FF4D00]/30"}`}>
      <div className="flex items-center gap-3 mb-3">
        <ToolIcon icon="delivery" className="w-5 h-5 text-[#6B6B6B]" />
        <div>
          <p className="font-semibold text-[#0D0D0D] text-sm">Delivery Estimate</p>
          {vehicleName && <p className="text-xs text-[#6B6B6B]">{vehicleName}</p>}
        </div>
      </div>

      {distance && (
        <div className="flex justify-between text-sm text-[#6B6B6B] mb-2">
          <span>Distance</span>
          <span className="font-medium text-[#0D0D0D]">{distance}</span>
        </div>
      )}

      {eligible ? (
        <div className="flex items-center gap-2 mt-2 bg-emerald-50 rounded-lg px-4 py-2.5">
          <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          <div>
            <span className="font-semibold text-emerald-700 text-sm">Delivery available</span>
            {deliveryFee && (
              <span className="text-emerald-600 text-xs ml-2">({deliveryFee})</span>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 mt-2 bg-[#FFF1EB] rounded-lg px-4 py-2.5">
          <svg className="w-4 h-4 text-[#FF4D00] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <span className="font-semibold text-[#FF4D00] text-sm">Too far for delivery</span>
        </div>
      )}

      {message && (
        <p className="text-xs text-[#6B6B6B] mt-2">{message}</p>
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
      <div className="bg-white border border-[#E8E6E1] rounded-xl p-4 text-sm text-center text-[#6B6B6B]">
        No bookings found.
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E8E6E1] rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-[#FAFAF8] border-b border-[#E8E6E1] flex items-center gap-2">
        <ToolIcon icon="booking" className="w-4 h-4 text-[#6B6B6B]" />
        <span className="font-semibold text-[#0D0D0D] text-sm">Your Bookings ({bookings.length})</span>
      </div>
      <div className="divide-y divide-[#F0EFEC]">
        {bookings.slice(0, 5).map((b, i) => {
          const bStatus = b.status ? String(b.status) : "pending";
          const bLink = b.link ? String(b.link) : `/bookings/${String(b.id ?? "")}`;
          const bVehicle = (b.vehicleName ?? b.vehicleId ?? "Booking") as string;
          const bStart = b.startDate
            ? new Date(String(b.startDate)).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
            : "";
          const bEnd = b.endDate
            ? new Date(String(b.endDate)).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
            : "";
          const bAmount = b.totalAmount ? String(b.totalAmount) : "";
          const bCurrency = b.currency ? String(b.currency) : "";
          return (
            <Link
              key={i}
              href={bLink}
              className="flex items-center justify-between px-4 py-3 hover:bg-[#FAFAF8] transition-colors"
            >
              <div className="min-w-0">
                <p className="font-medium text-[#0D0D0D] truncate text-sm">
                  {bVehicle}
                </p>
                <p className="text-xs text-[#6B6B6B] mt-0.5">
                  {bStart} - {bEnd}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                {bAmount && (
                  <span className="text-sm font-semibold text-[#0D0D0D]">
                    {bCurrency && `${bCurrency} `}{bAmount}
                  </span>
                )}
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusStyle[bStatus] ?? statusStyle.pending}`}
                >
                  {bStatus}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
      {bookings.length > 5 && (
        <p className="text-center text-xs text-[#999] py-2.5 border-t border-[#F0EFEC]">
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
    total: data.total as number | undefined,
  };

  const prices = vehicles.map((v) => {
    const raw = v.price ? String(v.price).replace(/[^\d.]/g, "") : "0";
    return Number(raw) || 0;
  });
  const maxPrice = Math.max(...prices, 1);

  return (
    <div className="bg-white border border-[#E8E6E1] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <ToolIcon icon="price" className="w-4 h-4 text-[#6B6B6B]" />
        <span className="font-semibold text-[#0D0D0D] text-sm">
          Price Comparison
          {stats.total != null && <span className="text-[#6B6B6B] font-normal ml-1">({stats.total} vehicles)</span>}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {stats.cheapest && (
          <div className="text-center bg-emerald-50 rounded-lg px-3 py-2">
            <p className="text-xs text-emerald-600 font-medium">Cheapest</p>
            <p className="text-sm font-bold text-emerald-700">{stats.cheapest}</p>
          </div>
        )}
        {stats.average && (
          <div className="text-center bg-[#FAFAF8] rounded-lg px-3 py-2">
            <p className="text-xs text-[#6B6B6B] font-medium">Average</p>
            <p className="text-sm font-bold text-[#0D0D0D]">{stats.average}</p>
          </div>
        )}
        {stats.mostExpensive && (
          <div className="text-center bg-[#FFF1EB] rounded-lg px-3 py-2">
            <p className="text-xs text-[#FF4D00] font-medium">Highest</p>
            <p className="text-sm font-bold text-[#E64500]">{stats.mostExpensive}</p>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {vehicles.slice(0, 6).map((v, i) => {
          const price = prices[i] ?? 0;
          const pct = maxPrice > 0 ? Math.round((price / maxPrice) * 100) : 0;
          const vName = (v.name ?? `${v.make ?? ""} ${v.model ?? ""}`.trim()) as string;
          const vFormatted = (v.price ?? v.priceFormatted ?? `${price}/day`) as string;
          const vType = v.type ? String(v.type) : "";
          const vLink = v.link ? String(v.link) : "";
          return (
            <div key={i}>
              <div className="flex justify-between mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  {vLink ? (
                    <Link href={vLink} className="text-sm text-[#0D0D0D] font-medium truncate hover:text-[#FF4D00]">
                      {vName}
                    </Link>
                  ) : (
                    <span className="text-sm text-[#0D0D0D] font-medium truncate">{vName}</span>
                  )}
                  {vType && (
                    <span className="text-[10px] text-[#6B6B6B] bg-[#F0EFEC] px-1.5 py-0.5 rounded capitalize flex-shrink-0">
                      {vType}
                    </span>
                  )}
                </div>
                <span className="text-sm text-[#FF4D00] font-semibold whitespace-nowrap ml-2">
                  {vFormatted}
                </span>
              </div>
              <div className="w-full h-2 bg-[#F0EFEC] rounded-full overflow-hidden">
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

function PriceBreakdownCard({ data }: { data: Record<string, unknown> }) {
  if (data.error) return null;

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
    <div className="bg-white border border-[#E8E6E1] rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="font-semibold text-[#0D0D0D] text-sm">
          {data.vehicle as string}
        </span>
        <span className="text-[#FF4D00] text-xs font-medium">
          {data.perDayEffective as string}/day eff.
        </span>
      </div>
      <div className="space-y-1.5 text-sm">
        {rows.map((r, i) => (
          <div
            key={i}
            className={`flex justify-between ${
              r.bold
                ? "border-t border-[#E8E6E1] pt-2 mt-2 font-semibold text-[#0D0D0D]"
                : "text-[#6B6B6B]"
            }`}
          >
            <span>{r.label}</span>
            {r.value && <span>{r.value}</span>}
          </div>
        ))}
      </div>
      {typeof data.bookLink === "string" && (
        <Link
          href={data.bookLink}
          className="flex items-center justify-center gap-2 w-full mt-4 text-sm font-semibold text-white bg-[#FF4D00] hover:bg-[#E64500] rounded-xl py-2.5 transition-colors"
        >
          Book Now
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      )}
    </div>
  );
}

function PickupPointsCard({ data }: { data: Record<string, unknown> }) {
  if (data.message && !data.pickupPoints) return null;

  const points = (data.pickupPoints ?? []) as Array<{
    name: string;
    landmark: string | null;
    latitude?: number;
    longitude?: number;
  }>;

  return (
    <div className="bg-white border border-[#E8E6E1] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <ToolIcon icon="location" className="w-4 h-4 text-[#FF4D00]" />
        <p className="font-semibold text-[#0D0D0D] text-sm">
          Pickup Points in {data.city as string} ({data.count as number})
        </p>
      </div>
      <div className="space-y-2">
        {points.slice(0, 8).map((p, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <svg
              className="w-4 h-4 text-[#FF4D00] flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
            <div>
              <span className="text-sm font-medium text-[#0D0D0D]">{p.name}</span>
              {p.landmark && (
                <span className="text-xs text-[#999] ml-1.5">-- {p.landmark}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecommendationsCard({
  data,
}: {
  data: { tripType?: string; recommendationNote?: string; vehicles: Array<Record<string, unknown>> };
}) {
  return (
    <div className="space-y-2">
      {data.tripType && (
        <div className="flex items-center gap-2 px-1">
          <SparkleIcon className="w-4 h-4 text-[#FF4D00]" />
          <span className="text-xs font-medium text-[#FF4D00] capitalize">{data.tripType} trip</span>
        </div>
      )}
      {data.recommendationNote && (
        <p className="text-xs text-[#6B6B6B] px-1">{data.recommendationNote}</p>
      )}
      {data.vehicles.slice(0, 5).map((v) => (
        <VehicleCard key={v.id as string} vehicle={v} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Markdown rendering
// ---------------------------------------------------------------------------

function MessageContent({ content }: { content: string }) {
  const lines = content.split("\n");

  return (
    <div className="whitespace-pre-wrap space-y-1">
      {lines.map((line, i) => {
        if (line.startsWith("### ")) {
          return (
            <p key={i} className="font-semibold text-[#0D0D0D] text-sm mt-2">
              {renderInline(line.slice(4))}
            </p>
          );
        }
        if (line.startsWith("## ")) {
          return (
            <p key={i} className="font-semibold text-[#0D0D0D] text-base mt-2">
              {renderInline(line.slice(3))}
            </p>
          );
        }
        if (/^[-*] /.test(line)) {
          return (
            <div key={i} className="flex gap-2 ml-1">
              <span className="text-[#FF4D00] flex-shrink-0">·</span>
              <span>{renderInline(line.slice(2))}</span>
            </div>
          );
        }
        if (/^\d+\. /.test(line)) {
          const num = line.match(/^(\d+)\. /)?.[1];
          return (
            <div key={i} className="flex gap-2 ml-1">
              <span className="text-[#FF4D00] flex-shrink-0 font-medium text-xs min-w-[16px]">
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
          className="bg-[#E8E6E1] text-[#0D0D0D] px-1 py-0.5 rounded text-xs font-mono"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    return <span key={i}>{part}</span>;
  });
}

// ---------------------------------------------------------------------------
// Command Bar
// ---------------------------------------------------------------------------

const STORAGE_KEY = "vroom-cmdk-history";
const MAX_STORED_MESSAGES = 50;
const NEAR_ME_RE = /\bnear\s*me\b/i;

function getGeolocation(): Promise<{ latitude: number; longitude: number } | null> {
  if (!navigator.geolocation) return Promise.resolve(null);
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 8000, maximumAge: 300_000 },
    );
  });
}

export function CommandBar() {
  const { open, setOpen } = useCommandBar();
  const [input, setInput] = useState("");
  const [locating, setLocating] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const coordsRef = useRef<{ latitude: number; longitude: number } | null>(null);
  // eslint-disable-next-line react-hooks/refs -- coordsRef.current is accessed in the body callback, not during render
  const [transport] = useState(() => new DefaultChatTransport({
    api: "/api/chat",
    body: () => {
      const c = coordsRef.current;
      return c ? { latitude: c.latitude, longitude: c.longitude } : {};
    },
  }));

  const { messages, sendMessage, status, setMessages, error } = useChat({
    transport,
  });

  const isLoading = status === "submitted" || status === "streaming";
  const isAuthError = status === "error" && error?.message?.includes("Unauthorized");

  // ---- Restore chat history from localStorage ----
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Persist messages ----
  useEffect(() => {
    if (messages.length === 0) {
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
      return;
    }
    try {
      const toStore = messages.slice(-MAX_STORED_MESSAGES);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch {
      // quota exceeded
    }
  }, [messages]);

  // ---- Notify global store on booking mutations ----
  const lastNotifiedRef = useRef(0);
  useEffect(() => {
    if (messages.length <= lastNotifiedRef.current) return;
    let hasMutation = false;
    for (let i = lastNotifiedRef.current; i < messages.length; i++) {
      const msg = messages[i] as { role: string; parts?: MessagePart[] };
      if (msg.role !== "assistant" || !msg.parts) continue;
      for (const p of msg.parts) {
        const name = p.toolName
          || (p.type?.startsWith("tool-") && p.type !== "tool-invocation" ? p.type.slice(5) : "")
          || p.toolInvocation?.toolName || "";
        if (name === "manageBookings") {
          const out = (p.output ?? p.toolInvocation?.result) as Record<string, unknown> | undefined;
          if (out && (out.bookingId !== undefined || out.refund !== undefined || out.tier !== undefined)) {
            hasMutation = true;
          }
        }
      }
    }
    lastNotifiedRef.current = messages.length;
    if (hasMutation) notify("bookings");
  }, [messages]);

  // ---- Auto-focus when opened ----
  useEffect(() => {
    if (open) {
      // Small delay to allow the transition to start before focusing
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
    }
  }, [open]);

  // ---- Scroll to bottom on new messages ----
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, status]);

  // ---- Auto-resize textarea ----
  const adjustTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const maxH = 3 * 28; // ~3 lines
    el.style.height = `${Math.min(el.scrollHeight, maxH)}px`;
  }, []);

  useEffect(() => {
    adjustTextarea();
  }, [input, adjustTextarea]);

  // ---- Submit ----
  const handleSubmit = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;
      setInput("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      if (NEAR_ME_RE.test(trimmed) && !coordsRef.current) {
        setLocating(true);
        coordsRef.current = await getGeolocation();
        setLocating(false);
      }
      sendMessage({ text: trimmed });
    },
    [isLoading, sendMessage],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(input);
    }
  };

  const clearHistory = useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    setMessages([]);
  }, [setMessages]);

  // ---- Find active loading tools ----
  const activeLoadingTool = (() => {
    if (!isLoading) return null;
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (!msg) continue;
      const parts = (msg.parts ?? []) as MessagePart[];
      for (const p of parts) {
        const isToolPart = p.type === "tool-invocation" || p.type === "dynamic-tool" || (p.type && p.type.startsWith("tool-"));
        const name = p.toolName || (p.type && p.type.startsWith("tool-") && p.type !== "tool-invocation" ? p.type.slice(5) : "") || p.toolInvocation?.toolName || "";
        if (isToolPart && name && (p.state === "input-streaming" || p.state === "input-available" || p.state === "partial-call" || p.state === "call")) {
          return name;
        }
      }
    }
    return null;
  })();

  // Don't render anything when closed (but keep state)
  if (!open) return null;

  const hasMessages = messages.length > 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm animate-[cmdkFadeIn_150ms_ease-out]"
        onClick={() => setOpen(false)}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-[100] flex items-start justify-center pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-2xl mx-4 sm:mx-auto mt-[8vh] sm:mt-[15vh] animate-[cmdkSlideIn_200ms_ease-out]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-[#E8E6E1]/60 overflow-hidden flex flex-col max-h-[80vh] sm:max-h-[75vh]">
            {/* Loading bar */}
            {isLoading && (
              <div className="h-0.5 w-full bg-[#F0EFEC] overflow-hidden relative flex-shrink-0">
                <div className="h-full w-1/3 bg-gradient-to-r from-[#FF4D00] to-[#E64500] rounded-full animate-[cmdkSlide_1.5s_ease-in-out_infinite]" />
              </div>
            )}

            {/* Input area */}
            <div className="flex items-start gap-3 px-5 py-4 border-b border-[#F0EFEC] flex-shrink-0">
              <SparkleIcon className="w-5 h-5 text-[#FF4D00] flex-shrink-0 mt-1" />
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Vroom AI anything..."
                rows={1}
                className="flex-1 text-lg text-[#0D0D0D] placeholder:text-[#999] bg-transparent border-none outline-none resize-none leading-7"
                style={{ maxHeight: `${3 * 28}px` }}
              />
              {!input && !hasMessages && (
                <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs text-[#999] bg-[#F0EFEC] rounded-md font-mono flex-shrink-0 mt-1">
                  <span className="text-sm">⌘</span>K
                </kbd>
              )}
              {input && (
                <button
                  onClick={() => handleSubmit(input)}
                  disabled={isLoading}
                  className="p-1.5 bg-[#FF4D00] hover:bg-[#E64500] disabled:bg-[#E8E6E1] text-white rounded-lg transition-colors flex-shrink-0 mt-0.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
                  </svg>
                </button>
              )}
            </div>

            {/* Geolocation loading */}
            {locating && (
              <div className="flex items-center gap-2 px-5 py-2 bg-[#FAFAF8] border-b border-[#F0EFEC] flex-shrink-0">
                <div className="w-4 h-4 relative flex-shrink-0">
                  <div className="absolute inset-0 border-2 border-[#FF4D00] border-t-transparent rounded-full animate-spin" />
                </div>
                <span className="text-xs text-[#6B6B6B]">Getting your location...</span>
              </div>
            )}

            {/* Tool-specific loading text */}
            {!locating && isLoading && activeLoadingTool && (
              <div className="flex items-center gap-2 px-5 py-2 bg-[#FAFAF8] border-b border-[#F0EFEC] flex-shrink-0">
                <div className="w-4 h-4 relative flex-shrink-0">
                  <div className="absolute inset-0 border-2 border-[#FF4D00] border-t-transparent rounded-full animate-spin" />
                </div>
                <span className="text-xs text-[#6B6B6B]">
                  {getToolLoadingText(activeLoadingTool).text}
                </span>
              </div>
            )}

            {/* Quick suggestions (shown when no messages and input is empty) */}
            {!hasMessages && !input && (
              <div className="px-5 py-4 flex-shrink-0">
                <p className="text-xs text-[#999] mb-3">Try asking</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSubmit(s)}
                      className="text-sm text-[#0D0D0D] bg-[#FAFAF8] hover:bg-[#F0EFEC] border border-[#E8E6E1] hover:border-[#FF4D00]/30 rounded-full px-4 py-2 transition-all hover:shadow-sm"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Results / conversation area */}
            {hasMessages && (
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-0"
                style={{ maxHeight: "60vh" }}
              >
                {messages.map((msg) => {
                  const parts = (msg.parts ?? []) as MessagePart[];
                  const textParts = parts.filter(
                    (p): p is MessagePart & { text: string } =>
                      p.type === "text" && !!p.text,
                  );
                  const toolParts: MessagePart[] = [];
                  for (const p of parts) {
                    if (p.type === "tool-invocation" || p.type === "dynamic-tool" || (p.type && p.type.startsWith("tool-"))) {
                      toolParts.push(p);
                    }
                  }

                  const text = textParts.map((p) => p.text).join("");

                  const isToolDone = (tp: MessagePart) =>
                    tp.state === "output-available" || tp.state === "result" || tp.state === "complete";

                  const getToolOutput = (tp: MessagePart): Record<string, unknown> | null => {
                    if (tp.output && typeof tp.output === "object") return tp.output as Record<string, unknown>;
                    if (tp.toolInvocation?.result && typeof tp.toolInvocation.result === "object") return tp.toolInvocation.result as Record<string, unknown>;
                    return null;
                  };
                  const getToolName = (tp: MessagePart): string => {
                    if (tp.toolName) return tp.toolName;
                    if (tp.type && tp.type.startsWith("tool-") && tp.type !== "tool-invocation") return tp.type.slice(5);
                    if (tp.toolInvocation?.toolName) return tp.toolInvocation.toolName;
                    return "";
                  };

                  let vehicleResults = toolParts
                    .filter(tp => getToolName(tp) === "searchVehicles" && isToolDone(tp))
                    .flatMap(tp => {
                      const result = getToolOutput(tp) as { vehicles?: Array<Record<string, unknown>> } | null;
                      return result?.vehicles ?? [];
                    });

                  // Fallback: scan ALL parts for any with vehicles data
                  if (vehicleResults.length === 0 && msg.role === "assistant") {
                    for (const p of parts) {
                      const raw = p as unknown as Record<string, unknown>;
                      const output = (raw.output ?? (raw.toolInvocation as Record<string, unknown> | undefined)?.result) as Record<string, unknown> | undefined;
                      if (output && Array.isArray(output.vehicles) && output.vehicles.length > 0) {
                        vehicleResults = output.vehicles as Array<Record<string, unknown>>;
                        break;
                      }
                    }
                  }

                  const vehicleInfoResults = toolParts
                    .filter(tp => getToolName(tp) === "getVehicleInfo" && isToolDone(tp))
                    .map(tp => getToolOutput(tp))
                    .filter((r): r is Record<string, unknown> => r != null);
                  const priceResults = vehicleInfoResults.filter(r => r.total !== undefined || r.baseRate !== undefined);
                  const pickupResults = vehicleInfoResults.filter(r => r.pickupPoints !== undefined);
                  const availabilityResults = vehicleInfoResults.filter(r => r.available !== undefined);

                  const bookingActionResults = toolParts
                    .filter(tp => getToolName(tp) === "manageBookings" && isToolDone(tp))
                    .map(tp => getToolOutput(tp))
                    .filter((r): r is Record<string, unknown> => r != null);
                  const bookingResults = bookingActionResults.filter(r => r.bookingId !== undefined && (r.paymentLink !== undefined || r.confirmationLink !== undefined));
                  const cancellationResults = bookingActionResults.filter(r => r.refund !== undefined || r.tier !== undefined);
                  const myBookingsResults = bookingActionResults.filter(r => r.bookings !== undefined);

                  const compareResults = toolParts
                    .filter(tp => getToolName(tp) === "searchVehicles" && isToolDone(tp))
                    .map(tp => getToolOutput(tp))
                    .filter((r): r is Record<string, unknown> => r != null)
                    .filter(r => r.priceRange !== undefined);

                  const loadingTools = toolParts.filter(tp => tp.state === "input-streaming" || tp.state === "input-available");

                  const hasAnyResult =
                    text ||
                    vehicleResults.length > 0 ||
                    priceResults.length > 0 ||
                    pickupResults.length > 0 ||
                    bookingResults.length > 0 ||
                    cancellationResults.length > 0 ||
                    availabilityResults.length > 0 ||
                    myBookingsResults.length > 0 ||
                    compareResults.length > 0 ||
                    loadingTools.length > 0;

                  if (!hasAnyResult) return null;

                  // User message
                  if (msg.role === "user") {
                    return (
                      <div key={msg.id} className="flex justify-end">
                        <div className="max-w-[80%] bg-[#FF4D00] text-white rounded-2xl rounded-br-md px-4 py-2.5 text-sm leading-relaxed">
                          {text}
                        </div>
                      </div>
                    );
                  }

                  // Assistant message
                  return (
                    <div key={msg.id} className="space-y-3">
                      {/* Text */}
                      {text && (
                        <div className="text-sm text-[#0D0D0D] leading-relaxed">
                          <MessageContent content={text} />
                        </div>
                      )}

                      {/* Vehicle search results */}
                      {vehicleResults.length > 0 && (
                        <div className="space-y-2">
                          {vehicleResults.slice(0, 4).map((v) => (
                            <VehicleCard key={v.id as string} vehicle={v} />
                          ))}
                          {vehicleResults.length > 4 && (
                            <p className="text-xs text-[#999] text-center pt-1">
                              +{vehicleResults.length - 4} more results
                            </p>
                          )}
                        </div>
                      )}

                      {/* Price estimates */}
                      {priceResults.map((pr, i) => (
                        <PriceBreakdownCard key={`price-${i}`} data={pr!} />
                      ))}

                      {/* Pickup points */}
                      {pickupResults.map((pp, i) => (
                        <PickupPointsCard key={`pickup-${i}`} data={pp!} />
                      ))}

                      {/* Booking confirmations */}
                      {bookingResults.map((br, i) => (
                        <BookingConfirmationCard key={`booking-${i}`} data={br!} />
                      ))}

                      {/* Cancellations */}
                      {cancellationResults.map((cr, i) => (
                        <CancellationCard key={`cancel-${i}`} data={cr!} />
                      ))}

                      {/* Availability checks */}
                      {availabilityResults.map((ar, i) => (
                        <AvailabilityCard key={`avail-${i}`} data={ar!} />
                      ))}

                      {/* My bookings */}
                      {myBookingsResults.map((mb, i) => (
                        <BookingListCard key={`mybookings-${i}`} data={mb!} />
                      ))}

                      {/* Price comparisons */}
                      {compareResults.map((cp, i) => (
                        <PriceComparisonCard key={`compare-${i}`} data={cp!} />
                      ))}
                    </div>
                  );
                })}

                {/* Auth error */}
                {isAuthError && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-[#FAFAF8] border border-[#E8E6E1]">
                    <div className="w-8 h-8 rounded-full bg-[#FFF1EB] flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-[#FF4D00]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#0D0D0D]">Sign in to use Vroom AI</p>
                      <p className="text-xs text-[#999] mt-0.5">Create a free account to search cars, manage bookings, and more with AI.</p>
                      <Link href="/login" className="inline-block mt-2 text-xs font-semibold text-[#FF4D00] hover:text-[#E64500] transition-colors">
                        Sign in →
                      </Link>
                    </div>
                  </div>
                )}

                {/* Streaming typing indicator (when no tool is active) */}
                {isLoading && !activeLoadingTool && messages.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-[#FF4D00] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-1.5 h-1.5 bg-[#FF4D00] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-1.5 h-1.5 bg-[#FF4D00] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-[#F0EFEC] bg-[#FAFAF8] flex-shrink-0">
              <span className="text-xs text-[#999]">Powered by Vroom AI</span>
              {hasMessages && (
                <button
                  onClick={clearHistory}
                  className="text-xs text-[#999] hover:text-[#0D0D0D] transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes cmdkFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes cmdkSlideIn {
            from { opacity: 0; transform: scale(0.98) translateY(-8px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
          @keyframes cmdkSlide {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(200%); }
            100% { transform: translateX(-100%); }
          }
        `,
      }} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Command Bar Trigger (for nav)
// ---------------------------------------------------------------------------

export function CommandBarTrigger({
  variant = "light",
}: {
  variant?: "light" | "dark";
}) {
  const { setOpen } = useCommandBar();
  const isDark = variant === "dark";

  return (
    <button
      onClick={() => setOpen(true)}
      aria-label="Ask Vroom AI"
      className={`
        inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all
        ${
          isDark
            ? "text-white/70 hover:text-white hover:bg-white/10"
            : "text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#F0EFEC]"
        }
      `}
    >
      <svg
        className="w-4 h-4 text-[#FF4D00] flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
        />
      </svg>
      <span className="hidden sm:inline">Ask AI</span>
    </button>
  );
}
