import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { bookingService } from "@/services/booking";
import { vehicleService } from "@/services/vehicle";
import { tripService } from "@/services/trip";
import { reviewService } from "@/services/review";
import { formatPrice } from "@/lib/format";
import { Nav } from "@/components/nav";
import { CancelBookingButton } from "@/components/cancel-booking-button";
import { StartTripButton } from "@/components/start-trip-button";
import { MutationListener } from "@/components/mutation-listener";

const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Pending" },
  confirmed: { bg: "bg-[#FFF1EB]", text: "text-[#E64500]", label: "Confirmed" },
  cancelled: { bg: "bg-red-100", text: "text-red-800", label: "Cancelled" },
  active: { bg: "bg-blue-100", text: "text-blue-800", label: "Active" },
  completed: { bg: "bg-[#F0EFEC]", text: "text-[#6B6B6B]", label: "Completed" },
};

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;

  const booking = await bookingService.getById(id);
  if (!booking) notFound();

  if (
    booking.renterId !== session.user.id &&
    booking.hostId !== session.user.id &&
    session.user.role !== "admin"
  ) {
    notFound();
  }

  const vehicle = await vehicleService.getById(booking.vehicleId);
  const trip = await tripService.getByBooking(id);
  const existingReviews = await reviewService.getByBooking(id);
  const hasReviewed = existingReviews.some(
    (r) => r.reviewerId === session.user!.id
  );

  const isHost = booking.hostId === session.user.id;
  const isRenter = booking.renterId === session.user.id;

  const status = statusStyles[booking.status] ?? statusStyles.completed!;
  const canCancel = ["pending", "confirmed"].includes(booking.status);
  const canStartTrip = isHost && booking.status === "confirmed" && !trip;
  const canReview = booking.status === "completed" && !hasReviewed;

  const breakdown = booking.priceBreakdown as {
    baseRate?: number;
    days?: number;
    subtotal?: number;
    platformFee?: number;
    tax?: number;
    total?: number;
  } | null;

  const photos = vehicle ? (vehicle.photos ?? []) : [];
  const primaryPhoto = photos.find((p) => p.isPrimary) ?? photos[0] ?? null;
  const pickupOtp = (booking as any).pickupOtp as string | null;

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <MutationListener keys={["bookings"]} />
      <Nav />

      <main className="max-w-3xl mx-auto px-6 py-8">
        <Link
          href="/bookings"
          className="inline-flex items-center gap-1 text-sm text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors mb-6"
        >
          &larr; Back to bookings
        </Link>

        {/* Status Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A]">
              Booking Details
            </h1>
            <p className="text-xs text-[#999] mt-1">ID: {booking.id}</p>
          </div>
          <span
            className={`inline-block text-sm font-semibold px-3 py-1.5 rounded-full ${status.bg} ${status.text}`}
          >
            {status.label}
          </span>
        </div>

        {/* Vehicle Card */}
        {vehicle && (
          <div className="bg-white border border-[#E8E6E1] rounded-xl overflow-hidden mb-6">
            <div className="flex flex-col sm:flex-row">
              <div className="sm:w-56 h-40 sm:h-auto flex-shrink-0 bg-[#E8E6E1] relative">
                {primaryPhoto ? (
                  <Image
                    src={primaryPhoto.url}
                    alt={`${vehicle.make} ${vehicle.model}`}
                    fill
                    sizes="(max-width: 640px) 100vw, 224px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#999] text-sm">
                    No photo
                  </div>
                )}
              </div>
              <div className="p-5 flex flex-col justify-center">
                <h2 className="text-lg font-bold text-[#1A1A1A]">
                  {vehicle.make} {vehicle.model}
                </h2>
                <p className="text-sm text-[#6B6B6B] mt-0.5">
                  {vehicle.year}
                  {vehicle.variant ? ` · ${vehicle.variant}` : ""} ·{" "}
                  {vehicle.city}
                </p>
                <Link
                  href={`/vehicles/${vehicle.id}`}
                  className="text-sm text-[#FF4D00] hover:text-[#E64500] font-medium mt-2"
                >
                  View vehicle details
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Pickup OTP — Renter sees this when booking is confirmed */}
        {isRenter && booking.status === "confirmed" && pickupOtp && (
          <div className="bg-[#FFF1EB] border-2 border-[#FF4D00] rounded-xl p-6 mb-6 text-center">
            <p className="text-xs font-semibold text-[#E64500] uppercase tracking-wider mb-2">
              Your Pickup OTP
            </p>
            <p className="text-4xl font-extrabold text-[#FF4D00] tracking-[8px] font-mono">
              {pickupOtp}
            </p>
            <p className="text-sm text-[#E64500] mt-3">
              Share this OTP with the host when you arrive at the pickup location
            </p>
          </div>
        )}

        {/* Pickup Instructions — Renter, confirmed */}
        {isRenter && booking.status === "confirmed" && (
          <div className="bg-white border border-[#E8E6E1] rounded-xl p-6 mb-6">
            <h3 className="text-sm font-semibold text-[#1A1A1A] mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-[#FF4D00]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
              </svg>
              What to Do Next
            </h3>
            <ol className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#FF4D00] text-white text-xs font-bold flex items-center justify-center mt-0.5">1</span>
                <div>
                  <p className="text-sm font-medium text-[#1A1A1A]">Go to the pickup location</p>
                  <p className="text-xs text-[#6B6B6B] mt-0.5">{booking.pickupAddress ?? vehicle?.address ?? vehicle?.city ?? "See location below"}</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#FF4D00] text-white text-xs font-bold flex items-center justify-center mt-0.5">2</span>
                <div>
                  <p className="text-sm font-medium text-[#1A1A1A]">Share your pickup OTP with the host</p>
                  <p className="text-xs text-[#6B6B6B] mt-0.5">The host will verify your identity using the OTP</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#FF4D00] text-white text-xs font-bold flex items-center justify-center mt-0.5">3</span>
                <div>
                  <p className="text-sm font-medium text-[#1A1A1A]">Complete pre-trip inspection</p>
                  <p className="text-xs text-[#6B6B6B] mt-0.5">Check the car together — exterior, interior, fuel, odometer</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#FF4D00] text-white text-xs font-bold flex items-center justify-center mt-0.5">4</span>
                <div>
                  <p className="text-sm font-medium text-[#1A1A1A]">Host starts the trip — you&apos;re good to go!</p>
                </div>
              </li>
            </ol>
          </div>
        )}

        {/* Host: OTP verification hint */}
        {isHost && booking.status === "confirmed" && pickupOtp && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
            <h3 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
              Pickup Verification
            </h3>
            <p className="text-sm text-blue-700">
              When the renter arrives, ask them for their <strong>pickup OTP</strong>.
              Verify it matches <strong className="font-mono tracking-wider">{pickupOtp}</strong> before starting the trip.
            </p>
          </div>
        )}

        {/* Active trip info for renter */}
        {isRenter && booking.status === "active" && trip && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
              <h3 className="text-sm font-semibold text-blue-800">Trip in Progress</h3>
            </div>
            <p className="text-sm text-blue-700">
              Your trip is active. When you&apos;re done, return the car to the pickup location. The host will complete a post-trip inspection and end the trip.
            </p>
            <Link
              href={`/trips/${trip.id}`}
              className="inline-flex items-center gap-1 text-sm text-blue-600 font-medium mt-3 hover:text-blue-800"
            >
              View trip details &rarr;
            </Link>
          </div>
        )}

        {/* Dates */}
        <div className="bg-white border border-[#E8E6E1] rounded-xl p-6 mb-6">
          <h3 className="text-sm font-semibold text-[#1A1A1A] mb-4">
            Rental Period
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-[#999] mb-1">Pick-up</p>
              <p className="text-sm font-medium text-[#1A1A1A]">
                {formatDate(booking.startDate)}
              </p>
              {booking.pickupAddress && (
                <p className="text-xs text-[#6B6B6B] mt-1">{booking.pickupAddress}</p>
              )}
            </div>
            <div>
              <p className="text-xs text-[#999] mb-1">Drop-off</p>
              <p className="text-sm font-medium text-[#1A1A1A]">
                {formatDate(booking.endDate)}
              </p>
              {booking.dropoffAddress && (
                <p className="text-xs text-[#6B6B6B] mt-1">{booking.dropoffAddress}</p>
              )}
            </div>
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="bg-white border border-[#E8E6E1] rounded-xl p-6 mb-6">
          <h3 className="text-sm font-semibold text-[#1A1A1A] mb-4">
            Price Breakdown
          </h3>
          {breakdown && breakdown.baseRate ? (
            <div className="space-y-3">
              <div className="flex justify-between text-sm text-[#6B6B6B]">
                <span>
                  {formatPrice(breakdown.baseRate, booking.currency)}/day x{" "}
                  {breakdown.days} day{(breakdown.days ?? 1) !== 1 ? "s" : ""}
                </span>
                <span>
                  {formatPrice(breakdown.subtotal ?? 0, booking.currency)}
                </span>
              </div>
              <div className="flex justify-between text-sm text-[#6B6B6B]">
                <span>Platform fee (18%)</span>
                <span>
                  {formatPrice(breakdown.platformFee ?? 0, booking.currency)}
                </span>
              </div>
              <div className="flex justify-between text-sm text-[#6B6B6B]">
                <span>Tax (5%)</span>
                <span>
                  {formatPrice(breakdown.tax ?? 0, booking.currency)}
                </span>
              </div>
              <div className="border-t border-[#E8E6E1] pt-3 flex justify-between text-base font-bold text-[#1A1A1A]">
                <span>Total</span>
                <span>
                  {formatPrice(booking.totalAmount, booking.currency)}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex justify-between text-base font-bold text-[#1A1A1A]">
              <span>Total</span>
              <span>
                {formatPrice(booking.totalAmount, booking.currency)}
              </span>
            </div>
          )}
        </div>

        {/* Cancellation Info */}
        {booking.status === "cancelled" && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
            <h3 className="text-sm font-semibold text-red-800 mb-2">
              Booking Cancelled
            </h3>
            {booking.cancellationReason && (
              <p className="text-sm text-red-700">
                Reason: {booking.cancellationReason}
              </p>
            )}
            {booking.cancelledAt && (
              <p className="text-xs text-red-500 mt-1">
                Cancelled on {formatDate(booking.cancelledAt)}
              </p>
            )}
          </div>
        )}

        {/* Trip Info */}
        {trip && (
          <div className="bg-white border border-[#E8E6E1] rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#1A1A1A]">Trip</h3>
              <Link
                href={`/trips/${trip.id}`}
                className="text-sm text-[#FF4D00] hover:text-[#E64500] font-medium"
              >
                View trip details
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-[#999]">Status</p>
                <p className="text-sm font-medium text-[#1A1A1A] capitalize">
                  {trip.status}
                </p>
              </div>
              {trip.actualStart && (
                <div>
                  <p className="text-xs text-[#999]">Started</p>
                  <p className="text-sm font-medium text-[#1A1A1A]">
                    {formatDate(trip.actualStart)}
                  </p>
                </div>
              )}
              {trip.actualEnd && (
                <div>
                  <p className="text-xs text-[#999]">Completed</p>
                  <p className="text-sm font-medium text-[#1A1A1A]">
                    {formatDate(trip.actualEnd)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Start Trip (host only, confirmed booking, no trip) */}
        {canStartTrip && (
          <div className="mb-6">
            <StartTripButton bookingId={booking.id} pickupOtp={pickupOtp ?? undefined} />
          </div>
        )}

        {/* Review CTA */}
        {canReview && (
          <div className="bg-[#FFF1EB] border border-[#FF4D00]/20 rounded-xl p-6 mb-6">
            <h3 className="text-sm font-semibold text-[#E64500] mb-2">
              How was your experience?
            </h3>
            <p className="text-sm text-[#FF4D00] mb-4">
              Your review helps other renters make informed decisions.
            </p>
            <Link
              href={`/bookings/${booking.id}/review`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF4D00] hover:bg-[#E64500] text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Leave a Review
            </Link>
          </div>
        )}

        {/* Cancel Button */}
        {canCancel && (
          <div className="flex justify-end">
            <CancelBookingButton bookingId={booking.id} />
          </div>
        )}
      </main>
    </div>
  );
}
