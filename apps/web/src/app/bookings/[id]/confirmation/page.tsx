import { auth } from "@/lib/auth";
import { bookingService } from "@/services/booking";
import { vehicleService } from "@/services/vehicle";
import { paymentService } from "@/services/payment";
import { formatPrice } from "@/lib/format";
import { redirect } from "next/navigation";
import Link from "next/link";
import { resolveUserId } from "@/lib/resolve-user-id";

export default async function BookingConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const booking = await bookingService.getById(id);
  const userId = await resolveUserId(session.user.id, session.user.email);
  if (!booking || booking.renterId !== userId) redirect("/bookings");

  const vehicle = await vehicleService.getById(booking.vehicleId);
  const payments = await paymentService.getByBookingId(id);
  const capturedPayment = payments.find(
    (p) => p.status === "captured" && p.type === "charge"
  );

  const breakdown = booking.priceBreakdown as {
    baseRate: number;
    days: number;
    subtotal: number;
    platformFee: number;
    tax: number;
    total: number;
    deliveryFee?: number;
    protectionFee?: number;
    discount?: number;
  } | null;
  const pickupOtp = (booking as unknown as { pickupOtp?: string | null }).pickupOtp ?? null;
  const startDate = new Date(booking.startDate);
  const endDate = new Date(booking.endDate);
  const days = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#FFF1EB] rounded-full mb-5">
            <svg
              className="w-10 h-10 text-[#FF4D00]"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">
            Booking Confirmed!
          </h1>
          <p className="text-[#6B6B6B]">
            Your reservation has been confirmed. Details below.
          </p>
        </div>

        {/* Pickup OTP */}
        {pickupOtp && (
          <div className="bg-[#FFF1EB] border-2 border-[#FF4D00] rounded-xl p-6 mb-6 text-center">
            <p className="text-xs font-semibold text-[#E64500] uppercase tracking-wider mb-2">
              Your Pickup OTP
            </p>
            <p className="text-4xl font-extrabold text-[#FF4D00] tracking-[8px] font-mono">
              {pickupOtp}
            </p>
            <p className="text-sm text-[#E64500] mt-3">
              Share this OTP with the host when you arrive at the pickup location to start your trip.
            </p>
          </div>
        )}

        {/* Booking Receipt */}
        <div className="bg-white border border-[#E8E6E1] rounded-xl overflow-hidden">
          {/* Vehicle Info */}
          {vehicle && (
            <div className="p-6 border-b border-[#F0EFEC]">
              <div className="flex items-center gap-4">
                {(vehicle.photos as Array<{ url: string }>)?.[0]?.url && (
                  <img
                    src={(vehicle.photos as Array<{ url: string }>)[0].url}
                    alt={`${vehicle.make} ${vehicle.model}`}
                    className="w-20 h-14 object-cover rounded-lg"
                  />
                )}
                <div>
                  <h2 className="font-semibold text-[#1A1A1A]">
                    {vehicle.make} {vehicle.model}{" "}
                    {vehicle.variant && (
                      <span className="font-normal text-[#6B6B6B]">
                        {vehicle.variant}
                      </span>
                    )}
                  </h2>
                  <p className="text-sm text-[#6B6B6B]">
                    {vehicle.city} &middot; {vehicle.year}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="p-6 border-b border-[#F0EFEC] grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-[#999] uppercase tracking-wider mb-1">
                Pick-up
              </p>
              <p className="text-sm font-semibold text-[#1A1A1A]">
                {startDate.toLocaleDateString("en-IN", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
              {booking.pickupAddress && (
                <p className="text-xs text-[#6B6B6B] mt-0.5">
                  {booking.pickupAddress}
                </p>
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-[#999] uppercase tracking-wider mb-1">
                Drop-off
              </p>
              <p className="text-sm font-semibold text-[#1A1A1A]">
                {endDate.toLocaleDateString("en-IN", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
              {booking.dropoffAddress && (
                <p className="text-xs text-[#6B6B6B] mt-0.5">
                  {booking.dropoffAddress}
                </p>
              )}
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="p-6 border-b border-[#F0EFEC] space-y-2">
            <p className="text-xs font-medium text-[#999] uppercase tracking-wider mb-3">
              Price Breakdown
            </p>
            {breakdown && (
              <>
                <div className="flex justify-between text-sm text-[#6B6B6B]">
                  <span>
                    {formatPrice(breakdown.baseRate, booking.currency)}/day x{" "}
                    {days} day{days !== 1 ? "s" : ""}
                  </span>
                  <span>
                    {formatPrice(breakdown.subtotal, booking.currency)}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-[#6B6B6B]">
                  <span>Platform fee</span>
                  <span>
                    {formatPrice(breakdown.platformFee, booking.currency)}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-[#6B6B6B]">
                  <span>Tax</span>
                  <span>
                    {formatPrice(breakdown.tax, booking.currency)}
                  </span>
                </div>
              </>
            )}
            <div className="border-t border-[#E8E6E1] pt-2 flex justify-between text-base font-bold text-[#1A1A1A]">
              <span>Total Paid</span>
              <span>
                {formatPrice(booking.totalAmount, booking.currency)}
              </span>
            </div>
          </div>

          {/* Payment Info */}
          <div className="p-6 border-b border-[#F0EFEC]">
            <p className="text-xs font-medium text-[#999] uppercase tracking-wider mb-2">
              Payment
            </p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#6B6B6B]">
                {capturedPayment?.method
                  ? capturedPayment.method.toUpperCase()
                  : "Online Payment"}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FFF1EB] text-[#E64500]">
                Paid
              </span>
            </div>
            {capturedPayment?.gatewayReference && (
              <p className="text-xs text-[#999] mt-1">
                Txn: {capturedPayment.gatewayReference}
              </p>
            )}
          </div>

          {/* Booking ID */}
          <div className="p-6 bg-[#FAFAF8]">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#6B6B6B]">Booking ID</span>
              <span className="font-mono text-xs text-[#6B6B6B]">
                {booking.id}
              </span>
            </div>
          </div>
        </div>

        {/* Pickup Instructions */}
        <div className="bg-white border border-[#E8E6E1] rounded-xl p-6 mt-6">
          <h3 className="text-sm font-semibold text-[#1A1A1A] mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-[#FF4D00]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
            What Happens Next
          </h3>
          <ol className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-[#FF4D00] text-white text-xs font-bold flex items-center justify-center mt-0.5">1</span>
              <div>
                <p className="text-sm font-medium text-[#1A1A1A]">Go to the pickup location on your start date</p>
                <p className="text-xs text-[#6B6B6B] mt-0.5">{booking.pickupAddress ?? vehicle?.address ?? vehicle?.city ?? "See your booking details"}</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-[#FF4D00] text-white text-xs font-bold flex items-center justify-center mt-0.5">2</span>
              <p className="text-sm font-medium text-[#1A1A1A]">Share your pickup OTP with the host</p>
            </li>
            <li className="flex items-start gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-[#FF4D00] text-white text-xs font-bold flex items-center justify-center mt-0.5">3</span>
              <p className="text-sm font-medium text-[#1A1A1A]">Complete the pre-trip inspection together</p>
            </li>
            <li className="flex items-start gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-[#FF4D00] text-white text-xs font-bold flex items-center justify-center mt-0.5">4</span>
              <p className="text-sm font-medium text-[#1A1A1A]">The host starts the trip — you&apos;re good to go!</p>
            </li>
          </ol>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Link
            href={`/bookings/${booking.id}`}
            className="flex-1 text-center px-5 py-2.5 bg-[#FF4D00] hover:bg-[#E64500] text-white font-medium rounded-lg transition-colors text-sm"
          >
            View Booking Details
          </Link>
          <Link
            href="/vehicles"
            className="flex-1 text-center px-5 py-2.5 border border-[#E8E6E1] text-[#1A1A1A] hover:bg-[#FAFAF8] font-medium rounded-lg transition-colors text-sm"
          >
            Browse More Cars
          </Link>
        </div>

        <p className="text-xs text-[#999] text-center mt-6">
          A confirmation email has been sent to {session.user.email}
        </p>
      </div>
    </div>
  );
}
