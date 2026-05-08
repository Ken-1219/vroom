import { Suspense } from "react";
import { vehicleService } from "@/services/vehicle";
import { Nav } from "@/components/nav";
import { VehicleFilters } from "@/components/vehicle-filters";
import { VehiclesContent } from "@/components/vehicles-content";
import { NLSearchBar } from "@/components/nl-search-bar";
import type { VehicleSearchParams } from "@vroom/validators";

const CITY_CENTERS: Record<string, { lat: number; lng: number }> = {
  bangalore: { lat: 12.9716, lng: 77.5946 },
  bengaluru: { lat: 12.9716, lng: 77.5946 },
};

function getCityCenter(city: string): { lat: number; lng: number } | null {
  const normalized = city.toLowerCase().trim();
  return CITY_CENTERS[normalized] ?? null;
}

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;

  const params: Partial<VehicleSearchParams> = {
    query: typeof raw.query === "string" ? raw.query : undefined,
    vehicleType:
      typeof raw.vehicleType === "string"
        ? (raw.vehicleType as VehicleSearchParams["vehicleType"])
        : undefined,
    transmission:
      typeof raw.transmission === "string"
        ? (raw.transmission as VehicleSearchParams["transmission"])
        : undefined,
    maxPrice: typeof raw.maxPrice === "string" ? Number(raw.maxPrice) : undefined,
    city: typeof raw.city === "string" ? raw.city : undefined,
    country: "IN",
    sortBy:
      typeof raw.sortBy === "string"
        ? (raw.sortBy as VehicleSearchParams["sortBy"])
        : "relevance",
    page: typeof raw.page === "string" ? Number(raw.page) : 1,
    limit: 12,
  };

  let latitude: number | undefined;
  let longitude: number | undefined;
  const radiusKm =
    typeof raw.radiusKm === "string" ? Number(raw.radiusKm) : undefined;

  if (typeof raw.latitude === "string" && typeof raw.longitude === "string") {
    latitude = Number(raw.latitude);
    longitude = Number(raw.longitude);
  } else if (params.city) {
    const center = getCityCenter(params.city);
    if (center) {
      latitude = center.lat;
      longitude = center.lng;
    }
  }

  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined)
  ) as VehicleSearchParams;

  let result: {
    vehicles: Array<any>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  try {
    result = await vehicleService.search({
      ...cleanParams,
      page: cleanParams.page ?? 1,
      limit: cleanParams.limit ?? 12,
      sortBy: cleanParams.sortBy ?? "relevance",
      ...(latitude !== undefined && { latitude }),
      ...(longitude !== undefined && { longitude }),
      radiusKm: radiusKm ?? 50,
    });
  } catch {
    result = { vehicles: [], total: 0, page: 1, limit: 12, totalPages: 0 };
  }

  const page = cleanParams.page ?? 1;
  const cityName = params.city ?? null;

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <Nav variant="light" />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-[#1A1A1A]">
            {cityName ? `Cars in ${cityName}` : "Cars in Bangalore"}
          </h1>
          <p className="text-sm text-[#6B6B6B] mt-1">
            {result.total} vehicle{result.total !== 1 ? "s" : ""} available
            {cityName && latitude ? ` within ${radiusKm ?? 50} km` : ""}
          </p>
        </div>

        <Suspense fallback={null}>
          <NLSearchBar />
        </Suspense>

        <Suspense fallback={<FilterSkeleton />}>
          <VehicleFilters />
        </Suspense>

        <VehiclesContent
          vehicles={result.vehicles}
          total={result.total}
          page={page}
          totalPages={result.totalPages}
          searchParams={raw}
          cityName={cityName}
          cityCenter={latitude !== undefined && longitude !== undefined ? { lat: latitude, lng: longitude } : null}
        />
      </main>
    </div>
  );
}

function FilterSkeleton() {
  return (
    <div className="bg-white border border-[#E8E6E1] rounded-2xl p-4 animate-pulse">
      <div className="flex gap-3">
        <div className="flex-1 h-10 bg-[#F0EFEC] rounded-xl" />
        <div className="w-28 h-10 bg-[#F0EFEC] rounded-xl" />
        <div className="w-36 h-10 bg-[#F0EFEC] rounded-xl" />
        <div className="w-36 h-10 bg-[#F0EFEC] rounded-xl" />
        <div className="w-32 h-10 bg-[#F0EFEC] rounded-xl" />
      </div>
    </div>
  );
}
