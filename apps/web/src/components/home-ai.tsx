"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";

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
  // AI SDK v3 compat — toolInvocation nested object
  toolInvocation?: {
    toolName?: string;
    toolCallId?: string;
    state?: string;
    result?: unknown;
    args?: unknown;
  };
}

interface ChatMessage {
  id: string;
  role: string;
  parts?: MessagePart[];
}

interface HomeAIProps {
  totalVehicles: number;
  startingPrice: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const QUICK_ACTIONS = [
  { label: "SUVs", query: "Show me SUVs available in Bangalore", icon: "suv" },
  { label: "Budget", query: "Cars under ₹1,500 per day", icon: "budget" },
  { label: "Luxury", query: "Luxury cars for a special occasion", icon: "luxury" },
  { label: "Electric", query: "Electric vehicles available right now", icon: "ev" },
  { label: "Family", query: "Best car for a family of 6", icon: "family" },
  { label: "Weekend", query: "Best cars for a weekend road trip", icon: "weekend" },
];

const TYPING_PHRASES = [
  "SUV for a weekend road trip...",
  "cheapest automatic in Koramangala...",
  "compare Creta vs Seltos prices...",
  "7-seater for a family trip...",
  "electric car under ₹2,000/day...",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getToolLoadingText(toolName: string): { text: string; icon: string } {
  switch (toolName) {
    case "searchVehicles":
      return { text: "Searching vehicles", icon: "car" };
    case "getVehicleInfo":
      return { text: "Getting details", icon: "car" };
    case "manageBookings":
      return { text: "Managing booking", icon: "booking" };
    default:
      return { text: "Working on it", icon: "default" };
  }
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function QuickActionIcon({ icon, className }: { icon: string; className?: string }) {
  const base = className ?? "w-5 h-5";
  switch (icon) {
    case "suv":
      return <svg className={base} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 17h.01M16 17h.01M3 11l1.5-5A2 2 0 016.4 4h11.2a2 2 0 011.9 1.4L21 11M3 11v6a1 1 0 001 1h1a1 1 0 001-1v-1h12v1a1 1 0 001 1h1a1 1 0 001-1v-6M3 11h18" /></svg>;
    case "budget":
      return <svg className={base} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>;
    case "luxury":
      return <svg className={base} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>;
    case "ev":
      return <svg className={base} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>;
    case "family":
      return <svg className={base} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>;
    case "weekend":
      return <svg className={base} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" /></svg>;
    default:
      return null;
  }
}

function ToolIcon({ icon, className }: { icon: string; className?: string }) {
  const base = className ?? "w-4 h-4";
  switch (icon) {
    case "car":
      return <svg className={base} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 17h.01M16 17h.01M3 11l1.5-5A2 2 0 016.4 4h11.2a2 2 0 011.9 1.4L21 11M3 11v6a1 1 0 001 1h1a1 1 0 001-1v-1h12v1a1 1 0 001 1h1a1 1 0 001-1v-6M3 11h18" /></svg>;
    case "booking":
      return <svg className={base} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>;
    case "price":
      return <svg className={base} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg>;
    case "location":
      return <svg className={base} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0Z" /></svg>;
    case "cancel":
      return <svg className={base} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>;
    case "check":
      return <svg className={base} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    case "delivery":
      return <svg className={base} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg>;
    case "sparkle":
      return <svg className={base} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>;
    default:
      return <svg className={base} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
  }
}

// ---------------------------------------------------------------------------
// Animated typing placeholder
// ---------------------------------------------------------------------------

function useTypingPlaceholder(phrases: string[], speed = 50, pause = 2000) {
  const [text, setText] = useState("");
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const phrase = phrases[phraseIdx]!;

    if (!deleting && charIdx < phrase.length) {
      const t = setTimeout(() => {
        setText(phrase.slice(0, charIdx + 1));
        setCharIdx(charIdx + 1);
      }, speed);
      return () => clearTimeout(t);
    }

    if (!deleting && charIdx === phrase.length) {
      const t = setTimeout(() => setDeleting(true), pause);
      return () => clearTimeout(t);
    }

    if (deleting && charIdx > 0) {
      const t = setTimeout(() => {
        setText(phrase.slice(0, charIdx - 1));
        setCharIdx(charIdx - 1);
      }, speed / 2);
      return () => clearTimeout(t);
    }

    if (deleting && charIdx === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDeleting(false);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPhraseIdx((prev) => (prev + 1) % phrases.length);
    }
  }, [charIdx, deleting, phraseIdx, phrases, speed, pause]);

  return text;
}

// ---------------------------------------------------------------------------
// Tool result cards (dark-themed)
// ---------------------------------------------------------------------------

function VehicleImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-white/[0.06] to-white/[0.02] flex items-center justify-center">
        <svg className="w-10 h-10 text-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M8 17h.01M16 17h.01M3 11l1.5-5A2 2 0 016.4 4h11.2a2 2 0 011.9 1.4L21 11M3 11v6a1 1 0 001 1h1a1 1 0 001-1v-1h12v1a1 1 0 001 1h1a1 1 0 001-1v-6M3 11h18" /></svg>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
    />
  );
}

function VehicleResultCard({ v }: { v: Record<string, unknown> }) {
  const photo = v.photo as string | null;
  const make = v.make as string;
  const model = v.model as string;
  const year = v.year as number;
  const transmission = v.transmission as string;
  const fuelType = v.fuelType as string;
  const seats = v.seats as number;
  const pricePerDay = v.pricePerDay as string;
  const location = (v.location ?? v.city ?? "") as string;
  const distanceKm = v.distanceKm as number | undefined;
  const rating = v.rating as string | null;
  const link = v.link as string;
  const bookLink = v.bookLink as string;

  return (
    <div className="group relative bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] hover:border-[#FF4D00]/30 rounded-2xl overflow-hidden transition-all duration-200">
      <div className="aspect-[16/9] overflow-hidden bg-white/[0.03]">
        {photo ? (
          <VehicleImage src={photo} alt={`${make} ${model}`} />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-white/[0.06] to-white/[0.02] flex items-center justify-center">
            <svg className="w-10 h-10 text-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M8 17h.01M16 17h.01M3 11l1.5-5A2 2 0 016.4 4h11.2a2 2 0 011.9 1.4L21 11M3 11v6a1 1 0 001 1h1a1 1 0 001-1v-1h12v1a1 1 0 001 1h1a1 1 0 001-1v-6M3 11h18" /></svg>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <Link href={link} className="text-sm font-semibold text-white hover:text-[#FF4D00] transition-colors truncate">
            {make} {model}
          </Link>
          <span className="text-sm font-bold text-[#FF4D00] whitespace-nowrap">
            {pricePerDay}<span className="text-[10px] text-white/40 font-normal">/day</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-white/40 mb-3">
          <span>{year}</span>
          <span className="text-white/20">·</span>
          <span className="capitalize">{transmission}</span>
          <span className="text-white/20">·</span>
          <span className="capitalize">{fuelType}</span>
          <span className="text-white/20">·</span>
          <span>{seats} seats</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-white/40 min-w-0">
            <span className="truncate">{location}</span>
            {distanceKm != null && (
              <>
                <span className="text-white/20 flex-shrink-0">·</span>
                <span className="flex-shrink-0">{distanceKm} km</span>
              </>
            )}
            {rating && (
              <>
                <span className="text-white/20 flex-shrink-0">·</span>
                <span className="text-amber-400 font-medium flex-shrink-0">★ {rating}</span>
              </>
            )}
          </div>
          <Link
            href={bookLink}
            className="text-xs font-semibold text-[#0D0D0D] bg-[#FF4D00] hover:bg-[#E64500] px-3.5 py-1.5 rounded-lg transition-colors"
          >
            Book
          </Link>
        </div>
      </div>
    </div>
  );
}

function DarkBookingConfirmationCard({ data }: { data: Record<string, unknown> }) {
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
    <div className="bg-[#FF4D00]/10 border border-[#FF4D00]/25 rounded-2xl p-5 text-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-full bg-[#FF4D00]/20 flex items-center justify-center">
          <svg className="w-5 h-5 text-[#FF4D00]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-[#FF4D00]">Booking Created</p>
          {vehicleName && <p className="text-white/50 text-xs">{vehicleName}</p>}
        </div>
      </div>
      <div className="space-y-2 mb-4">
        {startDate && endDate && (
          <div className="flex justify-between text-white/50"><span>Dates</span><span className="font-medium text-white/80">{formatDate(startDate)} – {formatDate(endDate)}</span></div>
        )}
        {totalAmount && (
          <div className="flex justify-between text-white/50"><span>Total</span><span className="font-semibold text-white">{totalAmount}</span></div>
        )}
      </div>
      {bookingId && <p className="text-[11px] font-mono text-white/30 mb-4">ID: {bookingId}</p>}
      {paymentLink && (
        <Link href={paymentLink} className="flex items-center justify-center gap-2 w-full text-sm font-semibold text-white bg-[#FF4D00] hover:bg-[#E64500] rounded-xl py-3 transition-colors">
          Pay Now
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
        </Link>
      )}
    </div>
  );
}

function DarkCancellationCard({ data }: { data: Record<string, unknown> }) {
  const tier = data.cancellationTier ? String(data.cancellationTier) : "";
  const refund = data.refundAmount ? String(data.refundAmount) : "";
  const penalty = data.penaltyAmount ? String(data.penaltyAmount) : "";

  return (
    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 text-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-full bg-red-500/20 flex items-center justify-center">
          <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </div>
        <p className="font-semibold text-red-400">Booking Cancelled</p>
      </div>
      <div className="space-y-2">
        {tier && <div className="flex justify-between text-white/50"><span>Tier</span><span className="font-medium text-white/80 capitalize">{tier}</span></div>}
        {refund && <div className="flex justify-between text-white/50"><span>Refund</span><span className="font-semibold text-emerald-400">{refund}</span></div>}
        {penalty && <div className="flex justify-between text-white/50"><span>Penalty</span><span className="font-medium text-red-400">{penalty}</span></div>}
      </div>
    </div>
  );
}

function DarkAvailabilityCard({ data }: { data: Record<string, unknown> }) {
  const available = Boolean(data.available);
  const vehicleName = (data.vehicle ?? data.vehicleName ?? "") as string;
  const conflicts = data.conflictingDates as Array<{ from: string; to: string }> | undefined;
  const suggestion = (data.suggestedAlternativeStart ?? data.message ?? "") as string;
  const bookLink = data.bookLink ? String(data.bookLink) : "";

  return (
    <div className={`border rounded-2xl p-5 text-sm ${available ? "bg-emerald-500/10 border-emerald-500/20" : "bg-red-500/10 border-red-500/20"}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${available ? "bg-emerald-500/20" : "bg-red-500/20"}`}>
          {available
            ? <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
            : <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          }
        </div>
        <div>
          <p className={`font-semibold ${available ? "text-emerald-400" : "text-red-400"}`}>{available ? "Available!" : "Not Available"}</p>
          {vehicleName && <p className="text-white/50 text-xs">{vehicleName}</p>}
        </div>
      </div>
      {!available && conflicts && conflicts.length > 0 && (
        <div className="mb-3 text-xs text-red-300/70">
          {conflicts.map((c, i) => <p key={i}>{c.from} – {c.to}</p>)}
        </div>
      )}
      {!available && suggestion && <p className="text-xs text-white/40 italic mb-3">Try from: {suggestion}</p>}
      {available && bookLink && (
        <Link href={bookLink} className="flex items-center justify-center gap-2 w-full text-sm font-semibold text-[#0D0D0D] bg-[#FF4D00] hover:bg-[#E64500] rounded-xl py-2.5 transition-colors mt-2">
          Book Now <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
        </Link>
      )}
    </div>
  );
}

function DarkDeliveryCard({ data }: { data: Record<string, unknown> }) {
  const eligible = Boolean(data.available ?? data.eligible);
  const distance = data.distance ? String(data.distance) : "";
  const deliveryFee = data.deliveryFee ? String(data.deliveryFee) : "";

  return (
    <div className={`border rounded-2xl p-5 text-sm ${eligible ? "bg-emerald-500/10 border-emerald-500/20" : "bg-white/[0.04] border-white/[0.08]"}`}>
      <p className="font-semibold text-white/90 mb-3">Delivery Estimate</p>
      {distance && <div className="flex justify-between text-white/50 mb-2"><span>Distance</span><span className="font-medium text-white/80">{distance}</span></div>}
      {eligible
        ? <div className="flex items-center gap-2 bg-emerald-500/15 rounded-xl px-4 py-3 mt-2"><svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg><span className="font-semibold text-emerald-400 text-sm">Available {deliveryFee && `(${deliveryFee})`}</span></div>
        : <div className="flex items-center gap-2 bg-[#FF4D00]/10 rounded-xl px-4 py-3 mt-2"><svg className="w-4 h-4 text-[#FF4D00]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" /></svg><span className="font-semibold text-[#FF4D00] text-sm">Too far for delivery</span></div>
      }
    </div>
  );
}

function DarkBookingListCard({ data }: { data: Record<string, unknown> }) {
  const bookings = (data.bookings ?? []) as Array<Record<string, unknown>>;
  const statusColor: Record<string, string> = { pending: "text-yellow-400 bg-yellow-400/15", confirmed: "text-[#FF4D00] bg-[#FF4D00]/15", active: "text-blue-400 bg-blue-400/15", completed: "text-white/50 bg-white/10", cancelled: "text-red-400 bg-red-400/15" };

  if (!bookings.length) return <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 text-sm text-center text-white/40">No bookings found.</div>;

  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2">
        <ToolIcon icon="booking" className="w-4 h-4 text-white/40" />
        <span className="font-semibold text-white/80 text-sm">Your Bookings ({bookings.length})</span>
      </div>
      <div className="divide-y divide-white/[0.06]">
        {bookings.slice(0, 5).map((b, i) => {
          const s = b.status ? String(b.status) : "pending";
          return (
            <Link key={i} href={b.link ? String(b.link) : `/bookings/${String(b.id ?? "")}`} className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.03] transition-colors">
              <div className="min-w-0">
                <p className="font-medium text-white/80 truncate text-sm">{(b.vehicleName ?? b.vehicleId ?? "Booking") as string}</p>
                <p className="text-xs text-white/30 mt-0.5">
                  {b.startDate ? new Date(String(b.startDate)).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : ""} - {b.endDate ? new Date(String(b.endDate)).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : ""}
                </p>
              </div>
              <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full capitalize ${statusColor[s] ?? statusColor.pending}`}>{s}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function DarkPriceComparisonCard({ data }: { data: Record<string, unknown> }) {
  const vehicles = (data.vehicles ?? []) as Array<Record<string, unknown>>;
  const priceRange = data.priceRange as string | undefined;

  const getPrice = (v: Record<string, unknown>) => {
    const raw = Number(v.rawPrice ?? 0);
    if (raw > 0) return raw;
    return Number(String(v.pricePerDay ?? v.price ?? "0").replace(/[^\d.]/g, "")) || 0;
  };
  const getPriceLabel = (v: Record<string, unknown>) =>
    (v.pricePerDay ?? v.price ?? v.priceFormatted ?? "") as string;

  const prices = vehicles.map(getPrice);
  const maxPrice = Math.max(...prices, 1);
  const sorted = [...vehicles].sort((a, b) => getPrice(a) - getPrice(b));
  const cheapest = sorted[0];
  const priciest = sorted[sorted.length - 1];

  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4">
      <p className="font-semibold text-white/80 text-sm mb-4">Price Comparison</p>
      {(priceRange || vehicles.length > 1) && cheapest && priciest && (
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="text-center bg-emerald-500/10 rounded-xl px-4 py-2">
            <p className="text-[10px] text-emerald-400 font-medium">From</p>
            <p className="text-sm font-bold text-emerald-300">{getPriceLabel(cheapest)}</p>
          </div>
          <div className="text-center bg-[#FF4D00]/10 rounded-xl px-4 py-2">
            <p className="text-[10px] text-[#FF4D00] font-medium">Up to</p>
            <p className="text-sm font-bold text-[#FF4D00]">{getPriceLabel(priciest)}</p>
          </div>
        </div>
      )}
      <div className="space-y-3">
        {vehicles.slice(0, 6).map((v, i) => {
          const pct = maxPrice > 0 ? Math.round(((prices[i] ?? 0) / maxPrice) * 100) : 0;
          const name = (v.name ?? `${v.make ?? ""} ${v.model ?? ""}`.trim()) as string;
          return (
            <div key={i}>
              <div className="flex justify-between mb-1"><span className="text-xs text-white/60 font-medium truncate mr-2">{name}</span><span className="text-xs text-[#FF4D00] font-semibold whitespace-nowrap">{getPriceLabel(v)}</span></div>
              <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-[#FF4D00] to-[#E64500] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} /></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DarkPriceBreakdownCard({ data }: { data: Record<string, unknown> }) {
  if (data.error) return null;
  const rows: Array<{ label: string; value: string; bold?: boolean }> = [];
  rows.push({ label: `${data.days} days × ${data.baseRate}`, value: "" });
  if (data.weekdayTotal) rows.push({ label: `Weekdays (${data.weekdays})`, value: data.weekdayTotal as string });
  if (data.weekendTotal && (data.weekendDays as number) > 0) rows.push({ label: `Weekends (${data.weekendDays})`, value: data.weekendTotal as string });
  rows.push({ label: `Protection (${data.protectionPlan})`, value: data.protectionFee as string });
  rows.push({ label: "Platform fee", value: data.platformFee as string });
  rows.push({ label: "Tax (GST)", value: data.tax as string });
  rows.push({ label: "Total", value: data.total as string, bold: true });

  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3"><span className="font-semibold text-white/80 text-sm">{data.vehicle as string}</span><span className="text-[#FF4D00] text-xs font-medium">{data.perDayEffective as string}/day eff.</span></div>
      <div className="space-y-1.5 text-sm">
        {rows.map((r, i) => (
          <div key={i} className={`flex justify-between ${r.bold ? "border-t border-white/[0.08] pt-2 mt-2 font-semibold text-white" : "text-white/50"}`}><span>{r.label}</span>{r.value && <span>{r.value}</span>}</div>
        ))}
      </div>
      {typeof data.bookLink === "string" && <Link href={data.bookLink} className="block text-center mt-3 text-sm font-semibold text-[#0D0D0D] bg-[#FF4D00] hover:bg-[#E64500] rounded-xl py-2.5 transition-colors">Book Now</Link>}
    </div>
  );
}

function DarkPickupPointsCard({ data }: { data: Record<string, unknown> }) {
  if (data.message && !data.pickupPoints) return null;
  const points = (data.pickupPoints ?? []) as Array<{ name: string; landmark: string | null }>;
  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4">
      <p className="font-semibold text-white/80 text-sm mb-3">Pickup Points in {data.city as string} ({data.count as number})</p>
      <div className="space-y-2">
        {points.slice(0, 6).map((p, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <svg className="w-4 h-4 text-[#FF4D00] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
            <div><span className="text-sm font-medium text-white/80">{p.name}</span>{p.landmark && <span className="text-xs text-white/40 ml-1.5">· {p.landmark}</span>}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Markdown
// ---------------------------------------------------------------------------

function MessageContent({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div className="whitespace-pre-wrap space-y-1.5">
      {lines.map((line, i) => {
        if (line.startsWith("### ")) return <p key={i} className="font-semibold text-white/90 text-[15px] mt-1.5">{renderInline(line.slice(4))}</p>;
        if (line.startsWith("## ")) return <p key={i} className="font-semibold text-white/90 text-base mt-1.5">{renderInline(line.slice(3))}</p>;
        if (/^[-*] /.test(line)) return <div key={i} className="flex gap-2 ml-1"><span className="text-[#FF4D00] flex-shrink-0">·</span><span>{renderInline(line.slice(2))}</span></div>;
        if (/^\d+\. /.test(line)) { const num = line.match(/^(\d+)\. /)?.[1]; return <div key={i} className="flex gap-2 ml-1"><span className="text-[#FF4D00] flex-shrink-0 font-medium text-xs min-w-[16px]">{num}.</span><span>{renderInline(line.replace(/^\d+\. /, ""))}</span></div>; }
        if (line.trim() === "") return <br key={i} />;
        return <span key={i}>{renderInline(line)}</span>;
      })}
    </div>
  );
}

function renderInline(text: string): React.ReactNode[] {
  return text.split(/(\[.+?\]\(.+?\)|\*\*.+?\*\*|`[^`]+`)/g).map((part, i) => {
    const linkMatch = part.match(/^\[(.+?)\]\((.+?)\)$/);
    if (linkMatch) return <Link key={i} href={linkMatch[2]!} className="text-[#FF4D00] underline hover:text-[#E64500] font-medium">{linkMatch[1]}</Link>;
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={i} className="font-semibold text-white/90">{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`")) return <code key={i} className="bg-white/10 text-white/80 px-1.5 py-0.5 rounded text-xs font-mono">{part.slice(1, -1)}</code>;
    return <span key={i}>{part}</span>;
  });
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

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

export function HomeAI({ totalVehicles, startingPrice }: HomeAIProps) {
  const [input, setInput] = useState("");
  const [focused, setFocused] = useState(false);
  const [locating, setLocating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isNearBottomRef = useRef(true);
  const coordsRef = useRef<{ latitude: number; longitude: number } | null>(null);

  // eslint-disable-next-line react-hooks/refs -- coordsRef.current is accessed in the body callback, not during render
  const [transport] = useState(() => new DefaultChatTransport({
    api: "/api/chat",
    body: () => {
      const c = coordsRef.current;
      return c ? { latitude: c.latitude, longitude: c.longitude } : {};
    },
  }));
  const { messages, sendMessage, status, setMessages, error } = useChat({ transport });

  const isLoading = status === "submitted" || status === "streaming";
  const isAuthError = status === "error" && error?.message?.includes("Unauthorized");
  const hasConversation = messages.length > 0;

  const typingPlaceholder = useTypingPlaceholder(TYPING_PHRASES, 45, 2200);

  const ROTATING_WORDS = ["next adventure", "road trip", "daily commute", "weekend plan", "office ride", "family outing"];
  const [wordIndex, setWordIndex] = useState(0);
  const [wordVisible, setWordVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordVisible(false);
      setTimeout(() => {
        setWordIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
        setWordVisible(true);
      }, 400);
    }, 3000);
    return () => clearInterval(interval);
  }, [ROTATING_WORDS.length]);

  // Scroll management
  const scrollToBottom = useCallback(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, []);
  const handleScroll = useCallback(() => { if (!scrollRef.current) return; isNearBottomRef.current = scrollRef.current.scrollHeight - scrollRef.current.scrollTop - scrollRef.current.clientHeight < 100; }, []);
  useEffect(() => { if (isNearBottomRef.current) scrollToBottom(); }, [messages, scrollToBottom]);

  const clearHistory = useCallback(() => { setMessages([]); }, [setMessages]);

  const doSend = useCallback(async (text: string) => {
    if (NEAR_ME_RE.test(text) && !coordsRef.current) {
      setLocating(true);
      coordsRef.current = await getGeolocation();
      setLocating(false);
    }
    sendMessage({ text });
  }, [sendMessage]);

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); const text = input.trim(); if (!text || isLoading) return; setInput(""); doSend(text); };
  const handleChipClick = (text: string) => { setInput(""); doSend(text); inputRef.current?.focus(); };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } };

  const extractToolName = (p: MessagePart): string => {
    if (p.toolName) return p.toolName;
    if (p.type && p.type.startsWith("tool-") && p.type !== "tool-invocation") return p.type.slice(5);
    if (p.toolInvocation?.toolName) return p.toolInvocation.toolName;
    return "";
  };

  // Find active loading tool
  const activeLoadingTool = (() => {
    if (!isLoading) return null;
    for (let i = messages.length - 1; i >= 0; i--) {
      const parts = (messages[i]?.parts ?? []) as MessagePart[];
      for (const p of parts) {
        const isToolPart = p.type === "tool-invocation" || p.type === "dynamic-tool" || (p.type && p.type.startsWith("tool-"));
        const name = extractToolName(p);
        if (isToolPart && name && (p.state === "input-streaming" || p.state === "input-available" || p.state === "partial-call" || p.state === "call")) return name;
      }
    }
    return null;
  })();

  function renderMessage(msg: ChatMessage) {
    const parts = (msg.parts ?? []) as MessagePart[];
    const textParts = parts.filter((p): p is MessagePart & { text: string } => p.type === "text" && !!p.text);

    // Match tool parts by any known type pattern
    const toolParts: MessagePart[] = [];
    for (const p of parts) {
      if (p.type === "tool-invocation" || p.type === "dynamic-tool" || (p.type && p.type.startsWith("tool-"))) {
        toolParts.push(p);
      }
    }

    const text = textParts.map((p) => p.text).join("");

    const isToolDone = (p: MessagePart) =>
      p.state === "output-available" || p.state === "result" || p.state === "complete";

    const getToolOutput = (p: MessagePart): Record<string, unknown> | null => {
      if (p.output && typeof p.output === "object") return p.output as Record<string, unknown>;
      if (p.toolInvocation?.result && typeof p.toolInvocation.result === "object") return p.toolInvocation.result as Record<string, unknown>;
      return null;
    };

    const getToolName = (p: MessagePart): string => {
      if (p.toolName) return p.toolName;
      if (p.type && p.type.startsWith("tool-") && p.type !== "tool-invocation") return p.type.slice(5);
      if (p.toolInvocation?.toolName) return p.toolInvocation.toolName;
      return "";
    };

    const getResults = (name: string) => toolParts
      .filter(p => getToolName(p) === name && isToolDone(p))
      .map(p => getToolOutput(p))
      .filter((r): r is Record<string, unknown> => r != null);

    const getVehicles = (name: string) => toolParts
      .filter(p => getToolName(p) === name && isToolDone(p))
      .flatMap(p => {
        const r = getToolOutput(p) as { vehicles?: Array<Record<string, unknown>> } | null;
        return r?.vehicles ?? [];
      });

    // Primary: extract from typed tool parts
    let allVehicles = getVehicles("searchVehicles");

    // Fallback: scan ALL parts for any with vehicles data (in case type matching fails)
    if (allVehicles.length === 0 && msg.role === "assistant") {
      for (const p of parts) {
        const raw = p as unknown as Record<string, unknown>;
        const output = (raw.output ?? (raw.toolInvocation as Record<string, unknown> | undefined)?.result) as Record<string, unknown> | undefined;
        if (output && Array.isArray(output.vehicles) && output.vehicles.length > 0) {
          allVehicles = output.vehicles as Array<Record<string, unknown>>;
          break;
        }
      }
    }

    const vehicleInfoResults = getResults("getVehicleInfo");
    const priceResults = vehicleInfoResults.filter(r => r.total !== undefined || r.baseRate !== undefined);
    const pickupResults = vehicleInfoResults.filter(r => r.pickupPoints !== undefined);
    const availabilityResults = vehicleInfoResults.filter(r => r.available !== undefined);

    const bookingActionResults = getResults("manageBookings");
    const bookingResults = bookingActionResults.filter(r => r.bookingId !== undefined && (r.paymentLink !== undefined || r.confirmationLink !== undefined));
    const cancellationResults = bookingActionResults.filter(r => r.refund !== undefined || r.tier !== undefined);
    const myBookingsResults = bookingActionResults.filter(r => r.bookings !== undefined);

    const compareResults = allVehicles.length > 0 ? getResults("searchVehicles").filter(r => r.priceRange !== undefined) : [];

    const hasAny = text || allVehicles.length > 0 || priceResults.length > 0 || pickupResults.length > 0 || bookingResults.length > 0 || cancellationResults.length > 0 || availabilityResults.length > 0 || myBookingsResults.length > 0 || compareResults.length > 0;
    if (!hasAny) return null;

    if (msg.role === "user") {
      return (
        <div key={msg.id} className="flex justify-end animate-[fadeSlideUp_0.3s_ease-out]">
          <div className="max-w-[85%] bg-[#FF4D00] text-white rounded-2xl rounded-br-md px-4 py-2.5 text-sm">{text}</div>
        </div>
      );
    }

    return (
      <div key={msg.id} className="space-y-4 animate-[fadeSlideUp_0.3s_ease-out]">
        {text && allVehicles.length === 0 && <div className="text-sm leading-relaxed text-white/70"><MessageContent content={text} /></div>}
        {allVehicles.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {allVehicles.slice(0, 6).map((v) => <VehicleResultCard key={v.id as string} v={v} />)}
          </div>
        )}
        {allVehicles.length > 6 && <p className="text-xs text-white/30 text-center">+{allVehicles.length - 6} more results</p>}
        {priceResults.map((pr, i) => <DarkPriceBreakdownCard key={`p-${i}`} data={pr} />)}
        {pickupResults.map((pp, i) => <DarkPickupPointsCard key={`pp-${i}`} data={pp} />)}
        {bookingResults.map((br, i) => <DarkBookingConfirmationCard key={`b-${i}`} data={br} />)}
        {cancellationResults.map((cr, i) => <DarkCancellationCard key={`c-${i}`} data={cr} />)}
        {availabilityResults.map((ar, i) => <DarkAvailabilityCard key={`a-${i}`} data={ar} />)}
        {myBookingsResults.map((mb, i) => <DarkBookingListCard key={`mb-${i}`} data={mb} />)}
        {compareResults.map((cp, i) => <DarkPriceComparisonCard key={`cp-${i}`} data={cp} />)}
      </div>
    );
  }

  return (
    <section className="relative bg-[#0D0D0D] overflow-hidden min-h-[calc(100vh-57px)]">
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] bg-[#FF4D00]/[0.035] rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[400px] bg-[#FF4D00]/[0.02] rounded-full blur-[120px] pointer-events-none" />

      {/* Noise */}
      <div className="absolute inset-0 opacity-[0.025] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 flex flex-col items-center justify-center min-h-[calc(100vh-57px)]">
        {/* Headline — collapses when conversation is active */}
        {!hasConversation && (
          <div className="text-center mb-10 sm:mb-12">
            <p className="text-[#FF4D00] text-xs sm:text-sm font-medium tracking-[0.25em] uppercase mb-5 hero-badge-enter">
              AI-Powered Car Rental
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-[2.5rem] sm:text-5xl lg:text-[4.25rem] font-extrabold text-white leading-[1.1] tracking-tight hero-headline-enter">
              <span className="hero-line-1">Find the perfect car</span>
              <br />
              <span className="hero-line-2 whitespace-nowrap">for your{" "}
                <span className="relative inline-block">
                  <span className="text-[#FF4D00] transition-all duration-400" style={{ opacity: wordVisible ? 1 : 0, transform: wordVisible ? "translateY(0)" : "translateY(8px)", display: "inline-block" }}>
                    {ROTATING_WORDS[wordIndex]}
                  </span>
                  <span className="absolute -bottom-1.5 left-0 right-0 h-[3px] bg-[#FF4D00]/30 rounded-full" />
                </span>
              </span>
            </h1>
            <p className="mt-5 sm:mt-7 text-white/35 text-sm sm:text-base max-w-lg mx-auto leading-relaxed hero-sub-enter">
              {totalVehicles}+ self-drive cars across Bangalore. Just describe what you need.
            </p>
          </div>
        )}

        {/* Compact header when conversation active */}
        {hasConversation && (
          <div className="w-full max-w-2xl flex items-center justify-between mb-4 pt-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#FF4D00] animate-pulse" />
              <span className="text-xs font-medium text-white/50">Vroom AI</span>
            </div>
            <button onClick={clearHistory} className="text-xs text-white/30 hover:text-white/60 transition-colors flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              New search
            </button>
          </div>
        )}

        {/* Search input — the centerpiece */}
        <div className={`w-full max-w-2xl ${!hasConversation ? "hero-input-enter" : ""}`}>
          <form onSubmit={handleSubmit} className="relative">
            {/* Animated gradient border */}
            <div className={`absolute -inset-[1px] rounded-2xl transition-opacity duration-500 ${focused || isLoading ? "opacity-100" : "opacity-0"}`} style={{ background: "conic-gradient(from 0deg, #FF4D00, #E64500, #FF6B2C, #FF4D00)" }} />

            <div className="relative flex items-center bg-[#1A1A1A] rounded-2xl border border-white/[0.08]">
              <div className="pl-5 pr-2 flex-shrink-0">
                {isLoading ? (
                  <div className="w-6 h-6 relative">
                    <div className="absolute inset-0 border-2 border-[#FF4D00] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <svg className="w-5 h-5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                )}
              </div>

              <div className="flex-1 relative py-4 sm:py-5 pr-2 min-w-0">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  aria-label="Search for a car with AI"
                  className="w-full text-base sm:text-lg bg-transparent focus:outline-none text-white placeholder:text-transparent min-w-0"
                  disabled={isLoading}
                />
                {/* Animated typing placeholder */}
                {!input && (
                  <div className="absolute inset-0 flex items-center pointer-events-none">
                    <span className="text-white/25 text-base sm:text-lg truncate">{typingPlaceholder}<span className="animate-pulse">|</span></span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                aria-label="Send message"
                className="mr-3 p-2.5 bg-[#FF4D00] hover:bg-[#E64500] disabled:bg-white/[0.06] text-white disabled:text-white/20 rounded-xl transition-all flex-shrink-0 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
                </svg>
              </button>
            </div>

            {/* Geolocation loading indicator */}
            {locating && (
              <div className="absolute -bottom-7 left-0 right-0 flex items-center justify-center gap-2">
                <ToolIcon icon="location" className="w-3.5 h-3.5 text-[#FF4D00]" />
                <span className="text-xs text-white/40">Getting your location</span>
                <div className="flex gap-0.5">
                  <div className="w-1 h-1 bg-[#FF4D00] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-1 h-1 bg-[#FF4D00] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-1 h-1 bg-[#FF4D00] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}

            {/* Tool loading indicator */}
            {!locating && isLoading && activeLoadingTool && (
              <div className="absolute -bottom-7 left-0 right-0 flex items-center justify-center gap-2">
                <ToolIcon icon={getToolLoadingText(activeLoadingTool).icon} className="w-3.5 h-3.5 text-[#FF4D00]" />
                <span className="text-xs text-white/40">{getToolLoadingText(activeLoadingTool).text}</span>
                <div className="flex gap-0.5">
                  <div className="w-1 h-1 bg-[#FF4D00] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-1 h-1 bg-[#FF4D00] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-1 h-1 bg-[#FF4D00] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Quick actions — visual tiles (only when no conversation) */}
        {!hasConversation && (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 mt-10 w-full max-w-2xl hero-chips-enter">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.label}
                onClick={() => handleChipClick(action.query)}
                className="group flex flex-col items-center gap-2 px-3 py-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-[#FF4D00]/30 transition-all duration-200"
              >
                <div className="w-9 h-9 rounded-xl bg-white/[0.06] group-hover:bg-[#FF4D00]/15 flex items-center justify-center transition-colors">
                  <QuickActionIcon icon={action.icon} className="w-[18px] h-[18px] text-white/40 group-hover:text-[#FF4D00] transition-colors" />
                </div>
                <span className="text-[11px] font-medium text-white/40 group-hover:text-white/70 transition-colors">{action.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Results area — dark-themed, inline */}
        {hasConversation && (
          <div className="w-full max-w-2xl mt-6 mb-8 flex-1 min-h-0">
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              role="log"
              aria-live="polite"
              className="space-y-5 max-h-[55vh] overflow-y-auto pr-2 scrollbar-thin"
            >
              {messages.map((msg) => renderMessage(msg as unknown as ChatMessage))}

              {isAuthError && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                  <div className="w-8 h-8 rounded-full bg-[#FF4D00]/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-[#FF4D00]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/80">Sign in to use Vroom AI</p>
                    <p className="text-xs text-white/40 mt-0.5">Create a free account to search cars, manage bookings, and more with AI.</p>
                    <Link href="/login" className="inline-block mt-2 text-xs font-semibold text-[#FF4D00] hover:text-[#FF6B2C] transition-colors">
                      Sign in →
                    </Link>
                  </div>
                </div>
              )}

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
          </div>
        )}

        {/* Stats row */}
        {!hasConversation && (
          <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-6 sm:gap-10 text-white/30 text-sm hero-stats-enter">
            <div className="text-center">
              <span className="text-white/60 font-semibold text-lg font-[family-name:var(--font-display)]">{totalVehicles}+</span>
              <p className="text-[10px] mt-0.5 tracking-wider uppercase">Vehicles</p>
            </div>
            <div className="w-px h-7 bg-white/[0.06]" />
            <div className="text-center">
              <span className="text-white/60 font-semibold text-lg font-[family-name:var(--font-display)]">40+</span>
              <p className="text-[10px] mt-0.5 tracking-wider uppercase">Areas</p>
            </div>
            <div className="w-px h-7 bg-white/[0.06]" />
            <div className="text-center">
              <span className="text-white/60 font-semibold text-lg font-[family-name:var(--font-display)]">4.8</span>
              <p className="text-[10px] mt-0.5 tracking-wider uppercase">Rating</p>
            </div>
            <div className="w-px h-7 bg-white/[0.06] hidden sm:block" />
            <div className="text-center hidden sm:block">
              <span className="text-white/60 font-semibold text-lg font-[family-name:var(--font-display)]">From {startingPrice}</span>
              <p className="text-[10px] mt-0.5 tracking-wider uppercase">Per Day</p>
            </div>
          </div>
        )}
      </div>

      {/* Animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: translateY(0); } }
        .hero-badge-enter { animation: heroFadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; animation-delay: 100ms; opacity: 0; }
        .hero-headline-enter .hero-line-1 { display: inline-block; animation: heroFadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards; animation-delay: 200ms; opacity: 0; }
        .hero-headline-enter .hero-line-2 { display: inline-block; animation: heroFadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards; animation-delay: 350ms; opacity: 0; }
        .hero-sub-enter { animation: heroFadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; animation-delay: 500ms; opacity: 0; }
        .hero-input-enter { animation: heroFadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards; animation-delay: 600ms; opacity: 0; }
        .hero-chips-enter { animation: heroFadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; animation-delay: 750ms; opacity: 0; }
        .hero-stats-enter { animation: heroFadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; animation-delay: 900ms; opacity: 0; }
        @keyframes heroFadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      ` }} />
    </section>
  );
}
