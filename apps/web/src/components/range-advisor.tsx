"use client";

import { useState } from "react";

interface RangeAdvisorProps {
  vehicleName: string;
  fuelType: string;
  defaultFrom?: string;
}

export function RangeAdvisor({ vehicleName, fuelType, defaultFrom = "Bangalore" }: RangeAdvisorProps) {
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    distanceKm: number | null;
    isEV: boolean;
    evRange: number | null;
    advice: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!from.trim() || !to.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/ai/range-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from, to, vehicleName, fuelType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const isEV = fuelType === "electric" || fuelType === "ev";

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm font-medium text-[#FF4D00] hover:text-[#E64500] transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          {isEV ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          )}
        </svg>
        {isEV ? "Check EV charging stops" : "Plan your fuel stops"}
        <svg
          className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div className="mt-4 bg-[#FAFAF8] border border-[#E8E6E1] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-[#FFF1EB] flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-[#FF4D00]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1A1A1A]">AI Range Advisor</p>
              <p className="text-xs text-[#999]">{vehicleName}</p>
            </div>
          </div>

          {isEV && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 mb-4">
              <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              <p className="text-xs text-emerald-700 font-medium">Electric vehicle — we&apos;ll check charging stop requirements</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#999] mb-1 block">From</label>
                <input
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  placeholder="e.g. Bangalore"
                  className="w-full px-3 py-2.5 text-sm border border-[#E8E6E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF4D00]/20 focus:border-[#FF4D00] bg-white"
                />
              </div>
              <div>
                <label className="text-xs text-[#999] mb-1 block">To</label>
                <input
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="e.g. Coorg, Goa..."
                  className="w-full px-3 py-2.5 text-sm border border-[#E8E6E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF4D00]/20 focus:border-[#FF4D00] bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !from.trim() || !to.trim()}
              className="w-full py-2.5 bg-[#FF4D00] hover:bg-[#E64500] disabled:bg-[#E8E6E1] disabled:text-[#999] text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                    <path d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" fill="currentColor" />
                  </svg>
                  Analysing route...
                </span>
              ) : "Get route advice"}
            </button>
          </form>

          {error && (
            <p className="mt-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {result && (
            <div className="mt-4 space-y-3">
              {result.distanceKm && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-sm text-[#1A1A1A]">
                    <svg className="w-4 h-4 text-[#FF4D00]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <span className="font-semibold">~{result.distanceKm} km</span>
                    <span className="text-[#999]">straight-line distance</span>
                  </div>
                  {result.isEV && result.evRange && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      result.distanceKm <= result.evRange
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}>
                      {result.distanceKm <= result.evRange ? "Single charge" : "Charging needed"}
                    </span>
                  )}
                </div>
              )}

              <div className="bg-white border border-[#E8E6E1] rounded-xl p-4">
                <div className="space-y-1.5">
                  {result.advice.split("\n").filter(Boolean).map((line, i) => (
                    <p key={i} className="text-sm text-[#4A4A4A] leading-relaxed flex gap-2">
                      {line.startsWith("-") || line.startsWith("•") ? (
                        <>
                          <span className="text-[#FF4D00] flex-shrink-0 mt-0.5">·</span>
                          <span>{line.replace(/^[-•]\s*/, "")}</span>
                        </>
                      ) : (
                        <span>{line}</span>
                      )}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
