"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { formatPrice } from "@/lib/format";

interface TripVehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  vehicleType: string;
  transmission: string;
  fuelType: string;
  baseDailyRate: number;
  currency: string;
  ratingAvg: string | null;
  reviewCount: number;
  images: string[];
  city: string;
  seats: number;
}

const SUGGESTIONS = [
  "Family road trip from Bangalore to Coorg, 4 days, 2 adults 2 kids",
  "Solo weekend getaway from Mumbai to Lonavala",
  "Group trip from Delhi to Shimla for 5 people, 3 days",
  "Couple trip from Pune to Goa, 5 days",
  "Day trip from Chennai to Pondicherry",
];

const CITY_RE = /\b(bangalore|bengaluru|mumbai|delhi|pune|hyderabad|chennai|kolkata|goa|shimla|manali|jaipur|coorg|lonavala|pondicherry|ooty)\b/i;

export function TripPlannerClient() {
  const [inputText, setInputText] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  const [vehicles, setVehicles] = useState<TripVehicle[]>([]);
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [response, vehicles]);

  const handleSubmit = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const cityMatch = trimmed.match(CITY_RE);
    const city = cityMatch ? cityMatch[1]!.toLowerCase() : undefined;

    setUserQuery(trimmed);
    setInputText("");
    setResponse("");
    setVehicles([]);
    setAuthRequired(false);
    setLoading(true);
    setSubmitted(true);

    const vehicleParams = new URLSearchParams({
      page: "1",
      limit: "6",
      sortBy: "rating",
      country: "IN",
    });
    if (city) vehicleParams.set("city", city);

    const streamRes = await fetch("/api/trip-planner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: trimmed, city }),
    });

    if (!streamRes.ok || !streamRes.body) {
      if (streamRes.status === 401) {
        setAuthRequired(true);
      } else {
        setResponse("Sorry, couldn't generate a plan right now. Please try again.");
      }
      setLoading(false);
      return;
    }

    fetch(`/api/vehicles/search?${vehicleParams.toString()}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.vehicles) setVehicles(data.vehicles);
      })
      .catch(() => {});

    try {
      const reader = streamRes.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setResponse((prev) => prev + decoder.decode(value, { stream: true }));
      }
    } catch {
      setResponse("Sorry, couldn't generate a plan right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setResponse("");
    setUserQuery("");
    setInputText("");
    setVehicles([]);
    setAuthRequired(false);
  };

  return (
    <div>
      {!submitted ? (
        <div className="bg-white border border-[#E8E6E1] rounded-2xl p-6 shadow-sm">
          <label className="block text-sm font-semibold text-[#1A1A1A] mb-2">
            Describe your trip
          </label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                handleSubmit(inputText);
              }
            }}
            placeholder="e.g. Family road trip from Bangalore to Coorg, 4 days, 2 adults 2 kids, prefer an automatic SUV"
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-[#E8E6E1] text-sm text-[#1A1A1A] placeholder:text-[#999] focus:outline-none focus:ring-2 focus:ring-[#FF4D00]/20 focus:border-[#FF4D00] resize-none transition-all"
          />

          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-[#999]">Press ⌘+Enter or click Plan Trip</p>
            <button
              onClick={() => handleSubmit(inputText)}
              disabled={!inputText.trim()}
              className="px-5 py-2.5 bg-[#FF4D00] hover:bg-[#E64500] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2z" />
              </svg>
              Plan Trip
            </button>
          </div>

          <div className="mt-5">
            <p className="text-xs text-[#999] mb-2.5 font-medium">Try an example:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setInputText(s)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-[#F5F5F0] hover:bg-[#EEEEE8] text-[#4A4A4A] transition-colors cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* User query bubble */}
          <div className="flex justify-end">
            <div className="max-w-md bg-[#FF4D00] text-white text-sm rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm">
              {userQuery}
            </div>
          </div>

          {/* AI response */}
          <div className="bg-white border border-[#E8E6E1] rounded-2xl p-6 shadow-sm min-h-[120px]">
            {authRequired ? (
              <div className="text-center py-4">
                <svg className="w-10 h-10 mx-auto text-[#E8E6E1] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                <p className="text-sm font-semibold text-[#1A1A1A] mb-1">Sign in to use Trip Planner</p>
                <p className="text-xs text-[#6B6B6B] mb-4">Create a free account to get AI-powered trip plans and vehicle recommendations.</p>
                <Link
                  href="/login?callbackUrl=/trip-planner"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF4D00] hover:bg-[#E64500] text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  Sign in
                </Link>
              </div>
            ) : loading && !response ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-[#6B6B6B] mb-4">
                  <svg className="w-4 h-4 text-[#FF4D00] animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Planning your trip...
                </div>
                {[100, 80, 90, 60, 75].map((w, i) => (
                  <div key={i} className="h-3 bg-[#F0EFEC] rounded animate-pulse" style={{ width: `${w}%` }} />
                ))}
              </div>
            ) : (
              <div className="prose prose-sm max-w-none prose-headings:font-display prose-headings:text-[#1A1A1A] prose-p:text-[#4A4A4A] prose-strong:text-[#1A1A1A] prose-li:text-[#4A4A4A] prose-a:text-[#FF4D00] prose-a:no-underline hover:prose-a:underline">
                <ReactMarkdown>{response}</ReactMarkdown>
                {loading && (
                  <span className="inline-block w-1.5 h-4 bg-[#FF4D00] animate-pulse ml-0.5 rounded-sm" />
                )}
              </div>
            )}
          </div>

          {/* Vehicle cards */}
          {vehicles.length > 0 && !loading && response && (
            <div>
              <h3 className="text-sm font-semibold text-[#1A1A1A] mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-[#FF4D00]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H21M3.375 14.25h-.008M21 14.25h.008M6.75 14.25h10.5M6.75 14.25V6a.75.75 0 01.75-.75h9a.75.75 0 01.75.75v8.25" />
                </svg>
                Available cars for this trip
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {vehicles.map((v) => (
                  <div
                    key={v.id}
                    onClick={() => router.push(`/vehicles/${v.id}`)}
                    className="group bg-white border border-[#E8E6E1] rounded-xl overflow-hidden hover:border-[#FF4D00]/30 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="relative h-32 bg-[#F5F5F0]">
                      {v.images?.[0] ? (
                        <Image
                          src={v.images[0]}
                          alt={`${v.make} ${v.model}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-[#999]">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H21M3.375 14.25h-.008M21 14.25h.008M6.75 14.25h10.5M6.75 14.25V6a.75.75 0 01.75-.75h9a.75.75 0 01.75.75v8.25" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-semibold text-[#1A1A1A] group-hover:text-[#FF4D00] transition-colors">
                        {v.make} {v.model} {v.year}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-[#6B6B6B]">
                        <span className="capitalize">{v.vehicleType}</span>
                        <span>·</span>
                        <span className="capitalize">{v.transmission}</span>
                        <span>·</span>
                        <span>{v.seats} seats</span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-semibold text-[#1A1A1A]">
                          {formatPrice(v.baseDailyRate, v.currency)}
                          <span className="text-xs font-normal text-[#999]">/day</span>
                        </span>
                        {v.ratingAvg && (
                          <span className="flex items-center gap-0.5 text-xs text-[#6B6B6B]">
                            <svg className="w-3.5 h-3.5 text-amber-400 fill-current" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            {parseFloat(v.ratingAvg).toFixed(1)}
                          </span>
                        )}
                      </div>
                      <Link
                        href={`/vehicles/${v.id}/book`}
                        className="mt-2 block w-full text-center py-1.5 text-xs font-semibold text-[#FF4D00] bg-[#FFF1EB] hover:bg-[#FFE4D6] rounded-lg transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Book this car
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {!loading && response && (
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={handleReset}
                className="px-4 py-2.5 text-sm font-semibold text-[#6B6B6B] hover:text-[#1A1A1A] bg-white hover:bg-[#F5F5F0] border border-[#E8E6E1] rounded-xl transition-colors cursor-pointer"
              >
                Plan another trip
              </button>
              <Link
                href="/vehicles"
                className="px-4 py-2.5 text-sm font-semibold text-white bg-[#FF4D00] hover:bg-[#E64500] rounded-xl transition-colors inline-flex items-center gap-1.5"
              >
                Browse all cars
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
                </svg>
              </Link>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
