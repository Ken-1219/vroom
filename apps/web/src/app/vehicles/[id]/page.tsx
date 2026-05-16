import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { vehicleService } from "@/services/vehicle";
import { reviewService } from "@/services/review";
import { Nav } from "@/components/nav";
import { ReviewList } from "@/components/review-list";
import {
  formatPrice,
  formatRating,
  getCountryFlag,
  getVehicleTypeLabel,
  getFuelTypeLabel,
  getFeatureLabel,
  getFeatureIcon,
} from "@/lib/format";
import { ReviewSummary } from "@/components/review-summary";
import { VehicleChat } from "@/components/vehicle-chat";
import { RangeAdvisor } from "@/components/range-advisor";
import { PriceDropAlert } from "@/components/price-drop-alert";

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let vehicle;
  try {
    vehicle = await vehicleService.getById(id);
  } catch {
    notFound();
  }

  if (!vehicle) {
    notFound();
  }

  const reviewStats = await reviewService.getByVehicle(vehicle.id, 1, 0);
  const realReviewCount = reviewStats.total;
  const realRatingAvg = reviewStats.avgRating;

  const todayDay = new Date().getDay(); // 0 = Sun, 6 = Sat
  const isTodayWeekend = todayDay === 0 || todayDay === 6;
  const hasWeekendRate = !!vehicle.weekendRate && vehicle.weekendRate !== vehicle.baseDailyRate;
  const displayRate = isTodayWeekend && hasWeekendRate ? vehicle.weekendRate! : vehicle.baseDailyRate;

  const photos = (vehicle.photos ?? []) as Array<{ url: string; position: number; isPrimary?: boolean }>;
  const features = (vehicle.features ?? []) as string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rules = (vehicle.rules ?? {}) as Record<string, any>;
  const description = vehicle.description as string | null;

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <Nav variant="light" />

      {/* Photo Gallery — full bleed */}
      <div className="max-w-7xl mx-auto px-6 pt-6">
        <Link
          href="/vehicles"
          className="inline-flex items-center gap-2 text-sm text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors mb-4 group"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to Browse
        </Link>

        {photos.length > 0 ? (
          photos.length >= 5 ? (
            <div className="grid grid-cols-4 grid-rows-2 gap-2 rounded-2xl overflow-hidden h-[420px]">
              <div className="col-span-2 row-span-2 relative bg-[#F0EFEC]">
                <Image
                  src={photos[0]!.url}
                  alt={`${vehicle.make} ${vehicle.model}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover hover:scale-[1.02] transition-transform duration-500"
                  priority
                />
              </div>
              {photos.slice(1, 5).map((p, i) => (
                <div key={i} className="relative bg-[#F0EFEC]">
                  <Image
                    src={p.url}
                    alt={`${vehicle.make} ${vehicle.model} photo ${i + 2}`}
                    fill
                    sizes="25vw"
                    className="object-cover hover:scale-[1.02] transition-transform duration-500"
                  />
                </div>
              ))}
            </div>
          ) : photos.length > 1 ? (
            <div className="grid grid-cols-3 gap-2 rounded-2xl overflow-hidden h-[380px]">
              <div className="col-span-2 relative bg-[#F0EFEC]">
                <Image
                  src={photos[0]!.url}
                  alt={`${vehicle.make} ${vehicle.model}`}
                  fill
                  sizes="66vw"
                  className="object-cover"
                  priority
                />
              </div>
              <div className="flex flex-col gap-2">
                {photos.slice(1, 3).map((p, i) => (
                  <div key={i} className="relative flex-1 bg-[#F0EFEC]">
                    <Image
                      src={p.url}
                      alt={`${vehicle.make} ${vehicle.model} photo ${i + 2}`}
                      fill
                      sizes="33vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden">
              <div className="relative aspect-[21/9] bg-[#F0EFEC]">
                <Image
                  src={photos[0]!.url}
                  alt={`${vehicle.make} ${vehicle.model}`}
                  fill
                  sizes="100vw"
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          )
        ) : (
          <div className="aspect-[21/9] bg-gradient-to-br from-[#F0EFEC] to-[#E8E6E1] rounded-2xl flex items-center justify-center">
            <div className="text-center">
              <svg className="w-16 h-16 text-[#E8E6E1] mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
              </svg>
              <span className="text-[#999] text-lg">No photos available</span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title block */}
            <div>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="text-xs font-semibold text-white bg-[#1A1A1A] px-3 py-1 rounded-full">
                  {getVehicleTypeLabel(vehicle.vehicleType)}
                </span>
                {vehicle.instantBooking && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#FF4D00] bg-[#FFF1EB] px-3 py-1 rounded-full">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
                    </svg>
                    Instant Booking
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-[#1A1A1A] tracking-tight">
                {vehicle.make} {vehicle.model}
              </h1>
              <p className="text-lg text-[#6B6B6B] mt-1">
                {vehicle.year}{vehicle.variant ? ` · ${vehicle.variant}` : ""}
              </p>

              {/* Stats row */}
              <div className="flex items-center gap-5 mt-5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-sm text-[#6B6B6B]">
                  <svg className="w-4 h-4 text-[#FF4D00]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  {vehicle.address ?? vehicle.city}
                </span>
                {realRatingAvg != null && realRatingAvg > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-sm">
                    <span className="text-amber-500">&#9733;</span>
                    <span className="font-semibold text-[#1A1A1A]">{realRatingAvg.toFixed(1)}</span>
                    <span className="text-[#999]">
                      ({realReviewCount} review{realReviewCount !== 1 ? "s" : ""})
                    </span>
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 text-sm text-[#6B6B6B]">
                  <svg className="w-4 h-4 text-[#999]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                  </svg>
                  {vehicle.tripCount} trip{vehicle.tripCount !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            <hr className="border-[#E8E6E1]" />

            {/* Key specs — horizontal strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <SpecItem label="Seats" value={`${vehicle.seats}`} icon="seats" />
              <SpecItem label="Transmission" value={vehicle.transmission === "automatic" ? "Automatic" : "Manual"} icon="transmission" />
              <SpecItem label="Fuel" value={getFuelTypeLabel(vehicle.fuelType)} icon="fuel" />
              {vehicle.color && <SpecItem label="Color" value={vehicle.color} icon="color" />}
            </div>

            {/* Description */}
            {description && (
              <>
                <hr className="border-[#E8E6E1]" />
                <div>
                  <h2 className="text-lg font-display font-bold text-[#1A1A1A] mb-3">
                    About this vehicle
                  </h2>
                  <p className="text-[#6B6B6B] leading-relaxed whitespace-pre-line">
                    {description}
                  </p>
                </div>
              </>
            )}

            {/* Features */}
            {features.length > 0 && (
              <>
                <hr className="border-[#E8E6E1]" />
                <div>
                  <h2 className="text-lg font-display font-bold text-[#1A1A1A] mb-4">
                    Features
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {features.map((f) => (
                      <div
                        key={f}
                        className="flex items-center gap-3 text-sm text-[#1A1A1A] bg-white border border-[#E8E6E1] rounded-xl px-4 py-3"
                      >
                        <span className="text-[#FF4D00] text-base flex-shrink-0">{getFeatureIcon(f)}</span>
                        <span>{getFeatureLabel(f)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Rules */}
            {(rules.mileageLimit || rules.noSmoking || rules.noPets) && (
              <>
                <hr className="border-[#E8E6E1]" />
                <div>
                  <h2 className="text-lg font-display font-bold text-[#1A1A1A] mb-4">
                    Rules
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {rules.mileageLimit && (
                      <RuleItem icon="mileage" text={`Mileage limit: ${rules.mileageLimit} km/day`} />
                    )}
                    {rules.noSmoking && <RuleItem icon="no" text="No smoking" />}
                    {rules.noPets && <RuleItem icon="no" text="No pets" />}
                  </div>
                </div>
              </>
            )}

            {/* Location */}
            <hr className="border-[#E8E6E1]" />
            <div>
              <h2 className="text-lg font-display font-bold text-[#1A1A1A] mb-3">
                Pickup Location
              </h2>
              <div className="flex items-start gap-3 bg-white border border-[#E8E6E1] rounded-xl p-4">
                <div className="w-10 h-10 rounded-full bg-[#FFF1EB] flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-[#FF4D00]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-[#1A1A1A]">{vehicle.address ?? vehicle.city}</p>
                  <p className="text-sm text-[#6B6B6B] mt-0.5">
                    Delivery available within 3 km for an extra fee
                  </p>
                </div>
              </div>
            </div>

            {/* Range / Fuel Advisor */}
            <hr className="border-[#E8E6E1]" />
            <div>
              <h2 className="text-lg font-display font-bold text-[#1A1A1A] mb-3">
                Plan your trip
              </h2>
              <RangeAdvisor
                vehicleName={`${vehicle.make} ${vehicle.model}`}
                fuelType={vehicle.fuelType}
              />
            </div>

            {/* Vehicle Condition */}
            <hr className="border-[#E8E6E1]" />
            <VehicleConditionSection
              tripCount={vehicle.tripCount ?? 0}
              year={vehicle.year}
              vehicleId={vehicle.id}
            />

            {/* Reviews */}
            <hr className="border-[#E8E6E1]" />
            <div>
              <h2 className="text-lg font-display font-bold text-[#1A1A1A] mb-4">
                Reviews
              </h2>
              <ReviewSummary vehicleId={vehicle.id} totalReviews={realReviewCount} />
              <ReviewList vehicleId={vehicle.id} />
            </div>
          </div>

          {/* Right column — sticky pricing */}
          <div>
            <div className="sticky top-20 space-y-5">
              {/* Pricing card */}
              <div className="bg-white border border-[#E8E6E1] rounded-2xl p-6 shadow-sm">
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-display font-bold text-[#1A1A1A]">
                    {formatPrice(displayRate, vehicle.currency)}
                  </span>
                  <span className="text-[#6B6B6B] text-base">/day</span>
                </div>

                {isTodayWeekend && hasWeekendRate ? (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-semibold text-[#FF4D00] bg-[#FFF1EB] px-2 py-0.5 rounded-full">Weekend rate</span>
                    <span className="text-sm text-[#999]">Weekday: {formatPrice(vehicle.baseDailyRate, vehicle.currency)}/day</span>
                  </div>
                ) : hasWeekendRate ? (
                  <p className="text-sm text-[#6B6B6B] mt-1">
                    Weekend: {formatPrice(vehicle.weekendRate!, vehicle.currency)}/day
                  </p>
                ) : null}

                {/* Discount badges */}
                <div className="mt-4 space-y-2">
                  {(vehicle.weeklyDiscountPct ?? 0) > 0 && (
                    <div className="flex items-center gap-2 text-sm text-[#FF4D00] bg-[#FFF1EB] rounded-xl px-3 py-2">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
                      </svg>
                      <span className="font-medium">{vehicle.weeklyDiscountPct}% off weekly</span>
                    </div>
                  )}
                  {(vehicle.monthlyDiscountPct ?? 0) > 0 && (
                    <div className="flex items-center gap-2 text-sm text-[#FF4D00] bg-[#FFF1EB] rounded-xl px-3 py-2">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
                      </svg>
                      <span className="font-medium">{vehicle.monthlyDiscountPct}% off monthly</span>
                    </div>
                  )}
                </div>

                {/* Quick spec badges */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="text-xs text-[#6B6B6B] bg-[#FAFAF8] border border-[#F0EFEC] px-2.5 py-1 rounded-lg">
                    {vehicle.seats} seats
                  </span>
                  <span className="text-xs text-[#6B6B6B] bg-[#FAFAF8] border border-[#F0EFEC] px-2.5 py-1 rounded-lg capitalize">
                    {vehicle.transmission}
                  </span>
                  <span className="text-xs text-[#6B6B6B] bg-[#FAFAF8] border border-[#F0EFEC] px-2.5 py-1 rounded-lg">
                    {getFuelTypeLabel(vehicle.fuelType)}
                  </span>
                </div>

                <div className="mt-6">
                  <Link
                    href={`/vehicles/${vehicle.id}/book`}
                    className="block w-full text-center px-6 py-3.5 bg-[#FF4D00] hover:bg-[#E64500] text-white font-semibold rounded-full transition-colors text-base"
                  >
                    Book Now
                  </Link>
                  <p className="text-xs text-[#999] text-center mt-3">
                    {vehicle.instantBooking
                      ? "Instant booking — confirm immediately"
                      : "Host approval required"}
                  </p>
                  <div className="flex justify-center mt-3">
                    <PriceDropAlert
                      vehicleId={vehicle.id}
                      vehicleName={`${vehicle.make} ${vehicle.model}`}
                    />
                  </div>
                </div>
              </div>

              {/* Host card */}
              <div className="bg-white border border-[#E8E6E1] rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-[#1A1A1A] mb-4">Hosted by</h3>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#FFF1EB] flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-[#FF4D00]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-[#1A1A1A]">Verified Host</span>
                      <svg className="w-4 h-4 text-[#FF4D00]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-xs text-[#999] mt-0.5">
                      Member since{" "}
                      {vehicle.createdAt
                        ? new Date(vehicle.createdAt).getFullYear()
                        : "2024"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <VehicleChat vehicleId={vehicle.id} />
    </div>
  );
}

const SPEC_ICONS: Record<string, React.ReactNode> = {
  seats: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0" />
    </svg>
  ),
  transmission: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  ),
  fuel: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" />
    </svg>
  ),
  color: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 0 0 5.304 0l6.401-6.402M6.75 21A3.75 3.75 0 0 1 3 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 0 0 3.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008Z" />
    </svg>
  ),
};

function SpecItem({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-white border border-[#E8E6E1] rounded-2xl">
      <div className="text-[#FF4D00]">{SPEC_ICONS[icon]}</div>
      <div>
        <p className="text-xs text-[#999] uppercase tracking-wider">{label}</p>
        <p className="text-sm font-semibold text-[#1A1A1A] capitalize">{value}</p>
      </div>
    </div>
  );
}

function VehicleConditionSection({
  tripCount,
  year,
  vehicleId,
}: {
  tripCount: number;
  year: number;
  vehicleId: string;
}) {
  const age = new Date().getFullYear() - year;
  const estKm = tripCount * 145;
  const estKmDisplay = estKm >= 1000 ? `~${(estKm / 1000).toFixed(1)}k km` : `~${estKm} km`;

  let conditionLabel = "Regular";
  let conditionColor = "text-[#6B6B6B] bg-[#F5F5F0]";
  if (tripCount < 10 && age <= 1) { conditionLabel = "Like New"; conditionColor = "text-emerald-700 bg-emerald-50"; }
  else if (tripCount < 30 && age <= 2) { conditionLabel = "Excellent"; conditionColor = "text-emerald-600 bg-emerald-50"; }
  else if (tripCount < 60 && age <= 4) { conditionLabel = "Good"; conditionColor = "text-blue-600 bg-blue-50"; }
  else if (tripCount < 100 && age <= 6) { conditionLabel = "Fair"; conditionColor = "text-amber-600 bg-amber-50"; }

  const stats = [
    {
      label: "Car age",
      value: age === 0 ? "Brand new" : `${age} yr${age > 1 ? "s" : ""} old`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
        </svg>
      ),
    },
    {
      label: "Trips on Vroom",
      value: `${tripCount} trip${tripCount !== 1 ? "s" : ""}`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
        </svg>
      ),
    },
    {
      label: "Est. mileage",
      value: estKmDisplay,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
        </svg>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-display font-bold text-[#1A1A1A]">Vehicle Condition</h2>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${conditionColor}`}>
          {conditionLabel}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-[#E8E6E1] rounded-xl p-3.5 flex flex-col gap-2">
            <div className="text-[#FF4D00]">{s.icon}</div>
            <div>
              <p className="text-xs text-[#999]">{s.label}</p>
              <p className="text-sm font-semibold text-[#1A1A1A]">{s.value}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-[#999] flex items-center gap-1.5">
        <svg className="w-3.5 h-3.5 text-[#FF4D00]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2z" />
        </svg>
        Mileage is estimated based on Vroom trip history (~145 km/trip avg). Ask the Car AI for more details.
      </p>
    </div>
  );
}

function RuleItem({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-[#1A1A1A] bg-white border border-[#E8E6E1] rounded-xl px-4 py-3">
      <span className="text-[#DC2626] flex-shrink-0">
        {icon === "mileage" ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        )}
      </span>
      <span>{text}</span>
    </div>
  );
}
