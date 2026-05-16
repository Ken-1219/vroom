"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { VehicleCard } from "./vehicle-card";
import type { Vehicle } from "@vroom/db/schema";

const VehicleMap = dynamic(
  () => import("./vehicle-map").then((m) => m.VehicleMap),
  { ssr: false, loading: () => <MapSkeleton /> }
);

interface MapPickupPoint {
  id: string;
  name: string;
  latitude: string;
  longitude: string;
  landmark?: string | null;
}

interface MapGeofence {
  id: string;
  name: string;
  type: string;
  boundary: GeoJSON.Geometry;
}

interface VehiclesContentProps {
  vehicles: (Vehicle & { distanceKm?: number | null })[];
  total: number;
  page: number;
  totalPages: number;
  searchParams: Record<string, string | string[] | undefined>;
  cityName?: string | null;
  cityCenter?: { lat: number; lng: number } | null;
}

export function VehiclesContent({
  vehicles,
  total,
  page,
  totalPages,
  searchParams,
  cityName,
  cityCenter,
}: VehiclesContentProps) {
  const [view, setView] = useState<"list" | "map">("list");
  const [pickupPoints, setPickupPoints] = useState<MapPickupPoint[]>([]);
  const [geofences, setGeofences] = useState<MapGeofence[]>([]);
  const [mapVehicles, setMapVehicles] = useState<(Vehicle & { distanceKm?: number | null })[]>([]);

  useEffect(() => {
    if (view !== "map" || total <= vehicles.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (view === "map" && total <= vehicles.length) setMapVehicles(vehicles);
      return;
    }
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) {
      if (typeof v === "string" && k !== "page") params.set(k, v);
    }
    params.set("limit", String(Math.min(total, 500)));
    params.set("page", "1");
    params.set("country", "IN");
    fetch(`/api/vehicles/search?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.vehicles) setMapVehicles(data.vehicles);
      })
      .catch(() => {});
  }, [view, searchParams, total, vehicles]);

  useEffect(() => {
    if (!cityName) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPickupPoints([]);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGeofences([]);
      return;
    }
    fetch(`/api/pickup-points?city=${encodeURIComponent(cityName)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setPickupPoints)
      .catch(() => setPickupPoints([]));

    fetch(`/api/geofences?city=${encodeURIComponent(cityName)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setGeofences)
      .catch(() => setGeofences([]));
  }, [cityName]);

  return (
    <>
      <div className="mt-4 flex items-center gap-1 bg-[#F0EFEC] rounded-xl p-1 w-fit">
        <button
          onClick={() => setView("list")}
          className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
            view === "list"
              ? "bg-white text-[#1A1A1A] shadow-sm"
              : "text-[#6B6B6B] hover:text-[#1A1A1A]"
          }`}
        >
          List
        </button>
        <button
          onClick={() => setView("map")}
          className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
            view === "map"
              ? "bg-white text-[#1A1A1A] shadow-sm"
              : "text-[#6B6B6B] hover:text-[#1A1A1A]"
          }`}
        >
          Map
        </button>
      </div>

      {vehicles.length === 0 ? (
        <div className="mt-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#FFF1EB] rounded-2xl mb-4">
            <svg className="w-8 h-8 text-[#FF4D00]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
          </div>
          <h2 className="text-lg font-display font-bold text-[#1A1A1A]">
            No vehicles found
          </h2>
          <p className="text-sm text-[#6B6B6B] mt-1 max-w-sm mx-auto">
            {cityName
              ? `No cars available in ${cityName} with these filters. Try a larger radius or fewer filters.`
              : "Try adjusting your filters or search terms."}
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <Link
              href="/vehicles"
              className="text-sm text-[#FF4D00] hover:text-[#E64500] font-medium"
            >
              Clear all filters
            </Link>
            {cityName && (
              <>
                <span className="text-[#E8E6E1]">|</span>
                <Link
                  href="/vehicles"
                  className="text-sm text-[#6B6B6B] hover:text-[#1A1A1A] font-medium"
                >
                  Search all areas
                </Link>
              </>
            )}
          </div>
        </div>
      ) : view === "map" ? (
        <div className="mt-4">
          <VehicleMap
            vehicles={(mapVehicles.length > 0 ? mapVehicles : vehicles).map((v) => ({
              id: v.id,
              make: v.make,
              model: v.model,
              latitude: v.latitude,
              longitude: v.longitude,
              baseDailyRate: v.baseDailyRate,
              currency: v.currency,
              vehicleType: v.vehicleType,
              ratingAvg: v.ratingAvg,
            }))}
            pickupPoints={pickupPoints}
            geofences={geofences}
            cityCenter={cityCenter}
            className="h-[550px]"
          />
        </div>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((v) => (
              <VehicleCard
                key={v.id}
                vehicle={v}
                distanceKm={v.distanceKm ?? null}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-4">
              {page > 1 && (
                <PaginationLink
                  page={page - 1}
                  searchParams={searchParams}
                  label="Previous"
                />
              )}
              <span className="text-sm text-[#6B6B6B]">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <PaginationLink
                  page={page + 1}
                  searchParams={searchParams}
                  label="Next"
                />
              )}
            </div>
          )}
        </>
      )}
    </>
  );
}

function PaginationLink({
  page,
  searchParams,
  label,
}: {
  page: number;
  searchParams: Record<string, string | string[] | undefined>;
  label: string;
}) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) {
    if (typeof v === "string" && k !== "page") params.set(k, v);
  }
  params.set("page", String(page));

  return (
    <Link
      href={`/vehicles?${params.toString()}`}
      className="px-5 py-2 text-sm font-medium text-[#1A1A1A] bg-white border border-[#E8E6E1] rounded-xl hover:border-[#999] transition-colors"
    >
      {label}
    </Link>
  );
}

function MapSkeleton() {
  return (
    <div className="h-[550px] bg-[#F0EFEC] rounded-2xl animate-pulse flex items-center justify-center">
      <span className="text-[#999]">Loading map...</span>
    </div>
  );
}
