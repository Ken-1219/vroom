"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface RecommendedVehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  vehicleType: string;
  pricePerDay: string;
  city: string;
  photo: string | null;
  ratingAvg: string;
  tripCount: number;
  reason?: string;
}

export function PersonalizedRecommendations() {
  const [vehicles, setVehicles] = useState<RecommendedVehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ai/recommendations")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setVehicles(Array.isArray(data) ? data : []))
      .catch(() => setVehicles([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="py-16 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-32 h-5 bg-[#F0EFEC] rounded animate-pulse" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-[#FAFAF8] rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-[#F0EFEC]" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-[#F0EFEC] rounded w-3/4" />
                  <div className="h-3 bg-[#F0EFEC] rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (vehicles.length === 0) return null;

  return (
    <section className="py-16 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#FFF1EB] flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-[#FF4D00]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold text-[#1A1A1A] tracking-tight">
                Recommended for you
              </h2>
              <p className="text-sm text-[#6B6B6B] mt-0.5">Picked by AI based on your trips</p>
            </div>
          </div>
          <Link
            href="/vehicles"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-[#FF4D00] hover:text-[#E64500] transition-colors"
          >
            View all
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {vehicles.map((v) => (
            <Link
              key={v.id}
              href={`/vehicles/${v.id}`}
              className="group bg-white border border-[#E8E6E1] rounded-2xl overflow-hidden hover:border-[#FF4D00]/30 hover:shadow-md transition-all duration-200"
            >
              <div className="aspect-[4/3] bg-[#F0EFEC] overflow-hidden relative">
                {v.photo ? (
                  <img
                    src={v.photo}
                    alt={`${v.make} ${v.model}`}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-[#DDD]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                    </svg>
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  <span className="text-[10px] font-semibold text-white bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full capitalize">
                    {v.vehicleType}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-[#1A1A1A] text-sm truncate">
                      {v.make} {v.model}
                    </p>
                    <p className="text-xs text-[#999] mt-0.5">{v.year} · {v.city}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-[#FF4D00]">{v.pricePerDay}</p>
                    <p className="text-[10px] text-[#999]">/day</p>
                  </div>
                </div>

                {Number(v.ratingAvg) > 0 && (
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-amber-500 text-xs">★</span>
                    <span className="text-xs font-medium text-[#1A1A1A]">{Number(v.ratingAvg).toFixed(1)}</span>
                    <span className="text-xs text-[#999]">· {v.tripCount} trips</span>
                  </div>
                )}

                {v.reason && (
                  <p className="mt-2.5 text-[11px] text-[#FF4D00] bg-[#FFF1EB] px-2.5 py-1.5 rounded-lg leading-snug">
                    ✦ {v.reason}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
