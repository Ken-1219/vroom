import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { vehicleService } from "@/services/vehicle";
import { formatPrice } from "@/lib/format";
import { Nav } from "@/components/nav";
import { BookingForm } from "@/components/booking-form";

const currencySymbols: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AED: "AED ",
  THB: "฿",
  MYR: "RM ",
  SGD: "S$",
};

export default async function BookVehiclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

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

  const photos = vehicle.photos ?? [];
  const primaryPhoto = photos.find((p) => p.isPrimary) ?? photos[0] ?? null;

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <Nav />

      <main className="max-w-3xl mx-auto px-6 py-8">
        <Link
          href={`/vehicles/${vehicle.id}`}
          className="inline-flex items-center gap-1 text-sm text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors mb-6"
        >
          &larr; Back to vehicle
        </Link>

        <h1 className="text-2xl font-bold text-[#1A1A1A] mb-6">Book Your Ride</h1>

        {/* Vehicle Summary Card */}
        <div className="bg-white border border-[#E8E6E1] rounded-xl overflow-hidden mb-8">
          <div className="flex flex-col sm:flex-row">
            <div className="sm:w-64 h-48 sm:h-auto flex-shrink-0 bg-[#E8E6E1] relative">
              {primaryPhoto ? (
                <Image
                  src={primaryPhoto.url}
                  alt={`${vehicle.make} ${vehicle.model}`}
                  fill
                  sizes="(max-width: 640px) 100vw, 256px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#999] text-sm">
                  No photo
                </div>
              )}
            </div>

            <div className="p-5 flex flex-col justify-center">
              <h2 className="text-xl font-bold text-[#1A1A1A]">
                {vehicle.make} {vehicle.model}
              </h2>
              <p className="text-sm text-[#6B6B6B] mt-0.5">
                {vehicle.year}
                {vehicle.variant ? ` · ${vehicle.variant}` : ""} · {vehicle.city}
              </p>
              <div className="mt-3">
                <span className="text-2xl font-bold text-[#1A1A1A]">
                  {formatPrice(vehicle.baseDailyRate, vehicle.currency)}
                </span>
                <span className="text-[#6B6B6B] text-sm">/day</span>
                {vehicle.weekendRate && vehicle.weekendRate !== vehicle.baseDailyRate && (
                  <span className="text-[#999] text-xs ml-2">
                    (Weekend: {formatPrice(vehicle.weekendRate, vehicle.currency)})
                  </span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {vehicle.instantBooking && (
                  <span className="inline-block text-xs font-semibold text-[#FF4D00] bg-[#FFF1EB] px-2.5 py-1 rounded-full">
                    Instant Booking
                  </span>
                )}
                {(vehicle.weeklyDiscountPct ?? 0) > 0 && (
                  <span className="inline-block text-xs font-medium text-[#FF4D00] bg-[#FFF1EB] px-2.5 py-1 rounded-full">
                    {vehicle.weeklyDiscountPct}% weekly discount
                  </span>
                )}
                {(vehicle.monthlyDiscountPct ?? 0) > 0 && (
                  <span className="inline-block text-xs font-medium text-[#FF4D00] bg-[#FFF1EB] px-2.5 py-1 rounded-full">
                    {vehicle.monthlyDiscountPct}% monthly discount
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Booking Form */}
        <div className="bg-white border border-[#E8E6E1] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-[#1A1A1A] mb-5">Select Dates</h2>
          <BookingForm
            vehicleId={vehicle.id}
            baseDailyRate={vehicle.baseDailyRate}
            weekendRate={vehicle.weekendRate}
            weeklyDiscountPct={vehicle.weeklyDiscountPct}
            monthlyDiscountPct={vehicle.monthlyDiscountPct}
            currency={vehicle.currency}
            currencySymbol={currencySymbols[vehicle.currency] ?? vehicle.currency + " "}
            formattedDailyRate={formatPrice(vehicle.baseDailyRate, vehicle.currency)}
            formattedWeekendRate={vehicle.weekendRate ? formatPrice(vehicle.weekendRate, vehicle.currency) : null}
            vehicleCity={vehicle.city}
            vehicleName={`${vehicle.make} ${vehicle.model}`}
            vehicleAddress={vehicle.address ?? vehicle.city}
            vehicleLatitude={Number(vehicle.latitude)}
            vehicleLongitude={Number(vehicle.longitude)}
          />
        </div>
      </main>
    </div>
  );
}
