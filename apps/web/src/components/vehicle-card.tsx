import Link from "next/link";
import Image from "next/image";
import type { Vehicle } from "@vroom/db/schema";
import {
  formatPrice,
  formatRating,
  getVehicleTypeLabel,
  getFuelTypeLabel,
  getFeatureLabel,
  getFeatureIcon,
} from "@/lib/format";

export function VehicleCard({
  vehicle,
  distanceKm,
}: {
  vehicle: Vehicle;
  distanceKm?: number | null;
}) {
  const photos = vehicle.photos ?? [];
  const primaryPhoto = photos.find((p) => p.isPrimary) ?? photos[0] ?? null;
  const features = vehicle.features ?? [];

  return (
    <Link
      href={`/vehicles/${vehicle.id}`}
      className="group card-hover rounded-2xl bg-white border border-[#E8E6E1] overflow-hidden block"
    >
      {/* Image */}
      <div className="aspect-[16/10] bg-gradient-to-br from-[#F0EFEC] to-[#E8E6E1] relative overflow-hidden">
        {primaryPhoto ? (
          <Image
            src={primaryPhoto.url}
            alt={`${vehicle.make} ${vehicle.model}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover img-zoom"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#999]">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
          </div>
        )}

        {/* Gradient overlay */}
        {primaryPhoto && (
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
        )}

        {/* Badges top-left */}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="text-[11px] font-semibold text-white bg-[#1A1A1A]/70 backdrop-blur-sm px-2.5 py-1 rounded-full">
            {getVehicleTypeLabel(vehicle.vehicleType)}
          </span>
          {vehicle.instantBooking && (
            <span className="text-[11px] font-semibold text-[#FF4D00] bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
              </svg>
              Instant
            </span>
          )}
        </div>

        {/* Location overlay bottom-left */}
        {primaryPhoto && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-white text-xs font-medium">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            {vehicle.city}
            {distanceKm != null && (
              <span className="text-white/70 ml-0.5">
                {distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m` : `${distanceKm.toFixed(1)} km`}
              </span>
            )}
          </div>
        )}

        {/* Rating top-right */}
        {Number(vehicle.ratingAvg) > 0 && (
          <div className="absolute top-3 right-3 flex items-center gap-1 text-xs text-white bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-full">
            <span className="text-amber-400">&#9733;</span>
            <span className="font-semibold">{formatRating(vehicle.ratingAvg!)}</span>
            <span className="text-white/60">({vehicle.tripCount})</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-bold text-[#1A1A1A] text-[15px]">
              {vehicle.make} {vehicle.model}
            </h3>
            <p className="text-xs text-[#999] mt-0.5">
              {vehicle.year}{vehicle.variant ? ` · ${vehicle.variant}` : ""}
            </p>
          </div>
        </div>

        {/* No-photo location fallback */}
        {!primaryPhoto && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-[#6B6B6B]">
            <svg className="w-3 h-3 text-[#999]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            {vehicle.city}
            {distanceKm != null && (
              <span className="text-[#999] ml-0.5">
                ({distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m` : `${distanceKm.toFixed(1)} km`})
              </span>
            )}
          </div>
        )}

        {/* Specs */}
        <div className="mt-3 flex items-center gap-2.5 text-xs text-[#6B6B6B]">
          <span>{vehicle.seats} seats</span>
          <span className="w-1 h-1 rounded-full bg-[#E8E6E1]" />
          <span>{vehicle.transmission === "automatic" ? "Auto" : "Manual"}</span>
          <span className="w-1 h-1 rounded-full bg-[#E8E6E1]" />
          <span>{getFuelTypeLabel(vehicle.fuelType)}</span>
        </div>

        {/* Features */}
        {features.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {features.slice(0, 3).map((f) => (
              <span
                key={f}
                className="inline-flex items-center gap-1 text-[11px] text-[#6B6B6B] bg-[#FAFAF8] border border-[#F0EFEC] px-2 py-0.5 rounded-md"
              >
                <span className="text-[10px]">{getFeatureIcon(f)}</span>
                {getFeatureLabel(f)}
              </span>
            ))}
            {features.length > 3 && (
              <span className="text-[11px] text-[#999] self-center ml-0.5">
                +{features.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Price */}
        <div className="mt-4 pt-3 border-t border-[#F0EFEC] flex items-center justify-between">
          <div>
            <span className="text-lg font-display font-bold text-[#1A1A1A]">
              {formatPrice(vehicle.baseDailyRate, vehicle.currency)}
            </span>
            <span className="text-sm text-[#999]">/day</span>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#FF4D00] group-hover:translate-x-0.5 transition-transform">
            View
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
