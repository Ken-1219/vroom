"use client";

import { useState, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

const EXAMPLES = [
  "cheap automatic SUV in Mumbai under ₹3000/day",
  "electric car in Bangalore",
  "budget sedan for a weekend trip",
  "premium automatic car in Pune",
];

export function NLSearchBar() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setExplanation(null);

    try {
      const res = await fetch("/api/nl-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed }),
      });

      if (!res.ok) throw new Error("Search failed");

      const data = await res.json();

      const params = new URLSearchParams(searchParams.toString());

      // Clear existing filters before applying new ones
      ["city", "vehicleType", "transmission", "maxPrice", "sortBy", "query", "page"].forEach((k) =>
        params.delete(k)
      );

      if (data.city) params.set("city", data.city);
      if (data.vehicleType) params.set("vehicleType", data.vehicleType);
      if (data.transmission) params.set("transmission", data.transmission);
      if (data.maxPrice) params.set("maxPrice", String(data.maxPrice));
      if (data.sortBy && data.sortBy !== "relevance") params.set("sortBy", data.sortBy);
      if (data.query) params.set("query", data.query);

      if (data.explanation) setExplanation(data.explanation);

      router.push(`${pathname}?${params.toString()}`);
    } catch {
      setError("Couldn't parse that search. Try being more specific.");
    } finally {
      setLoading(false);
    }
  };

  const exampleIndex = Math.floor(Date.now() / 10000) % EXAMPLES.length;

  return (
    <div className="mb-4">
      <div className="relative flex items-center gap-2">
        {/* Sparkle icon */}
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
          <svg className="w-4 h-4 text-[#FF4D00]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2z" />
          </svg>
          <span className="text-xs font-semibold text-[#FF4D00] hidden sm:inline">AI</span>
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch(query);
          }}
          placeholder={`Try "${EXAMPLES[exampleIndex]}"`}
          className="w-full pl-14 pr-28 py-3 rounded-xl border-2 border-[#FF4D00]/30 bg-white text-sm text-[#1A1A1A] placeholder:text-[#999] focus:outline-none focus:border-[#FF4D00] transition-all"
          aria-label="Natural language car search"
          disabled={loading}
        />

        <button
          onClick={() => handleSearch(query)}
          disabled={loading || !query.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-[#FF4D00] hover:bg-[#E64500] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
        >
          {loading ? (
            <span className="flex items-center gap-1.5">
              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Searching
            </span>
          ) : (
            "Search"
          )}
        </button>
      </div>

      {explanation && (
        <p className="mt-2 text-xs text-[#FF4D00] flex items-center gap-1.5">
          <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2z" />
          </svg>
          {explanation}
        </p>
      )}

      {error && (
        <p className="mt-2 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
