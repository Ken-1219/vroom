"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

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
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [response]);

  const handleSubmit = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const cityMatch = trimmed.match(CITY_RE);
    const city = cityMatch ? cityMatch[1]!.toLowerCase() : undefined;

    setUserQuery(trimmed);
    setInputText("");
    setResponse("");
    setLoading(true);
    setSubmitted(true);

    try {
      const res = await fetch("/api/trip-planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmed, city }),
      });

      if (!res.ok || !res.body) throw new Error("Request failed");

      const reader = res.body.getReader();
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
            {loading && !response ? (
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
