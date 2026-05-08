"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { PlacesAutocomplete } from "./places-autocomplete";
import { MobileFilterSheet } from "./mobile-filter-sheet";
import { CustomSelect } from "./ui/custom-select";

const PRICE_OPTIONS = [
  { label: "Under ₹500/day", value: "50000" },
  { label: "Under ₹1,000/day", value: "100000" },
  { label: "Under ₹1,500/day", value: "150000" },
  { label: "Under ₹2,000/day", value: "200000" },
  { label: "Under ₹3,000/day", value: "300000" },
  { label: "Under ₹5,000/day", value: "500000" },
  { label: "Under ₹8,000/day", value: "800000" },
];

const TYPE_OPTIONS = [
  { label: "Sedan", value: "sedan" },
  { label: "SUV", value: "suv" },
  { label: "Hatchback", value: "hatchback" },
  { label: "Luxury", value: "luxury" },
  { label: "EV", value: "ev" },
  { label: "MPV", value: "mpv" },
];

const TRANSMISSION_OPTIONS = [
  { label: "Manual", value: "manual" },
  { label: "Automatic", value: "automatic" },
];

const RADIUS_OPTIONS = [
  { label: "≤5 km", value: "5" },
  { label: "≤10 km", value: "10" },
  { label: "≤25 km", value: "25" },
  { label: "≤50 km", value: "50" },
  { label: "≤100 km", value: "100" },
];

const SORT_OPTIONS_BASE = [
  { label: "Sort: Relevance", value: "relevance" },
  { label: "Sort: Price", value: "price" },
  { label: "Sort: Rating", value: "rating" },
];

export function VehicleFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const current = {
    query: searchParams.get("query") ?? "",
    vehicleType: searchParams.get("vehicleType") ?? "",
    transmission: searchParams.get("transmission") ?? "",
    maxPrice: searchParams.get("maxPrice") ?? "",
    city: searchParams.get("city") ?? "",
    sortBy: searchParams.get("sortBy") ?? "relevance",
    radiusKm: searchParams.get("radiusKm") ?? "",
  };

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, searchParams, pathname]
  );

  const reset = useCallback(() => {
    router.push(pathname);
  }, [router, pathname]);

  const activeFilterCount = [
    current.query,
    current.vehicleType,
    current.transmission,
    current.maxPrice,
    current.city,
  ].filter(Boolean).length;

  const hasFilters = Object.values(current).some(
    (v) => v && v !== "relevance"
  );

  const sortOptions = current.city
    ? [...SORT_OPTIONS_BASE, { label: "Sort: Distance", value: "distance" }]
    : SORT_OPTIONS_BASE;

  const filterControls = (
    <div className="flex flex-col lg:flex-row gap-3">
      {/* Search */}
      <div className="flex-1 relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <svg className="w-4 h-4 text-[#999]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search make, model..."
          defaultValue={current.query}
          aria-label="Search vehicles"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              update("query", e.currentTarget.value);
            }
          }}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8E6E1] text-sm text-[#1A1A1A] placeholder:text-[#999] focus:outline-none focus:ring-2 focus:ring-[#FF4D00]/20 focus:border-[#FF4D00] transition-all"
        />
      </div>

      {/* City */}
      <PlacesAutocomplete
        placeholder="City, district, town..."
        value={current.city}
        types={["(regions)"]}
        onPlaceSelect={(place) => {
          const params = new URLSearchParams(searchParams.toString());
          params.set("city", place.city);
          params.set("latitude", String(place.lat));
          params.set("longitude", String(place.lng));
          params.delete("page");
          router.push(`${pathname}?${params.toString()}`);
        }}
        onClear={() => {
          const params = new URLSearchParams(searchParams.toString());
          params.delete("city");
          params.delete("latitude");
          params.delete("longitude");
          params.delete("page");
          router.push(`${pathname}?${params.toString()}`);
        }}
        onTextChange={(text) => {
          if (!text) {
            const params = new URLSearchParams(searchParams.toString());
            params.delete("city");
            params.delete("latitude");
            params.delete("longitude");
            router.push(`${pathname}?${params.toString()}`);
          }
        }}
        className="lg:w-56"
      />

      {/* Type */}
      <CustomSelect
        value={current.vehicleType}
        onChange={(v) => update("vehicleType", v)}
        options={TYPE_OPTIONS}
        placeholder="All Types"
        aria-label="Vehicle type"
      />

      {/* Transmission */}
      <CustomSelect
        value={current.transmission}
        onChange={(v) => update("transmission", v)}
        options={TRANSMISSION_OPTIONS}
        placeholder="Any Transmission"
        aria-label="Transmission"
      />

      {/* Price */}
      <CustomSelect
        value={current.maxPrice}
        onChange={(v) => update("maxPrice", v)}
        options={PRICE_OPTIONS}
        placeholder="Any Price"
        aria-label="Maximum price"
      />

      {/* Radius */}
      {current.city && (
        <CustomSelect
          value={current.radiusKm || "50"}
          onChange={(v) => update("radiusKm", v)}
          options={RADIUS_OPTIONS}
          aria-label="Search radius"
          className="lg:w-28"
        />
      )}

      {/* Sort */}
      <CustomSelect
        value={current.sortBy}
        onChange={(v) => update("sortBy", v)}
        options={sortOptions}
        aria-label="Sort by"
      />

      {hasFilters && (
        <button
          onClick={reset}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-[#6B6B6B] hover:text-[#1A1A1A] bg-[#FAFAF8] hover:bg-[#F0EFEC] border border-[#E8E6E1] transition-colors cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
          Clear
        </button>
      )}
    </div>
  );

  return (
    <div>
      <MobileFilterSheet activeCount={activeFilterCount}>
        {filterControls}
      </MobileFilterSheet>

      <div className="hidden lg:block bg-white border border-[#E8E6E1] rounded-2xl p-4">
        {filterControls}
      </div>
    </div>
  );
}
